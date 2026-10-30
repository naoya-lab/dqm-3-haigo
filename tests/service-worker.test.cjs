const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup({ response, offline = false, cacheFails = false } = {}) {
  const listeners = {};
  const entries = new Map([['./index.html', new Response('<html>offline</html>')]]);
  const cache = {
    match: async key => entries.get(typeof key === 'string' ? key : key.url),
    put: async (request, value) => {
      if (cacheFails) throw Error('storage unavailable');
      entries.set(request.url, value);
    },
  };
  vm.runInNewContext(fs.readFileSync(new URL('../sw.js', `file://${__filename}`), 'utf8'), {
    self: { addEventListener: (name, handler) => { listeners[name] = handler; },
      location: { origin: 'https://example.test' },
      registration: { scope: 'https://example.test/dqm-3-haigo/' } },
    caches: { open: async () => cache }, URL, Response, console: { warn() {} },
    fetch: async () => { if (offline) throw Error('offline'); return response; },
  });
  return { entries, async request(path, mode = 'cors') {
    let pending;
    const background = [];
    listeners.fetch({ request: { method: 'GET', mode, url: new URL(path, 'https://example.test').href },
      respondWith: promise => { pending = promise; }, waitUntil: promise => background.push(promise) });
    const result = await pending;
    await Promise.all(background);
    return result;
  } };
}

test('offline navigation receives the cached page but missing data never receives HTML', async () => {
  const sw = setup({ offline: true });
  assert.equal(await (await sw.request('/dqm-3-haigo/?refresh=1', 'navigate')).text(), '<html>offline</html>');
  for (const path of ['data.json', 'app.js', 'style.css']) {
    assert.equal((await sw.request(`/dqm-3-haigo/${path}`)).type, 'error');
  }
});

test('failed HTTP responses do not overwrite a previously cached resource', async () => {
  const sw = setup({ response: new Response('unavailable', { status: 503 }) });
  const url = 'https://example.test/dqm-3-haigo/data.json';
  sw.entries.set(url, new Response('{"cached":true}'));
  assert.equal((await sw.request('/dqm-3-haigo/data.json')).status, 503);
  assert.equal(await sw.entries.get(url).text(), '{"cached":true}');
});

test('a cache write failure does not discard a successful network response', async () => {
  const sw = setup({ response: new Response('{"online":true}'), cacheFails: true });
  assert.equal(await (await sw.request('/dqm-3-haigo/data.json')).text(), '{"online":true}');
});

test('leaves DQM4 and sibling apps to their own service workers', async () => {
  const sw = setup({ offline: true });
  assert.equal(await sw.request('/dqm-3-haigo/dqm4/app.js'), undefined);
  assert.equal(await sw.request('/kinmu.sakusei/index.html', 'navigate'), undefined);
});
