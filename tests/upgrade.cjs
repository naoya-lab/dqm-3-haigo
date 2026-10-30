// Verifies upgrade from the repository's original v50 deployment on one origin.
const {chromium}=require('playwright');
const {execFileSync}=require('node:child_process');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const ref=process.env.DQM_LEGACY_REF||'f1cf4a7';
const old=Object.fromEntries(['index.html','app.js','style.css','sw.js'].map(name=>[name,execFileSync('git',['show',`${ref}:${name}`],{cwd:root})]));
let legacy=true;
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';
 if(name.includes('..')){res.writeHead(400);res.end();return}
 try{const data=legacy&&old[name]?old[name]:fs.readFileSync(path.join(root,name));res.setHeader('Content-Type',name.endsWith('.js')?'application/javascript':name.endsWith('.html')?'text/html':name.endsWith('.css')?'text/css':name.endsWith('.json')||name.endsWith('.webmanifest')?'application/json':'image/png');res.setHeader('Cache-Control','no-store');res.end(data)}catch{res.writeHead(404);res.end()}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('526'));
  await page.evaluate(async()=>{localStorage.setItem('dqm3-acquired-monsters-v1','["スライム"]');localStorage.setItem('dqm3-plan-v2','{"target":"キングスライム","checked":{},"routes":{},"minRankEnabled":true,"minRank":"D"}');await navigator.serviceWorker.ready});
  await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller);
  assert((await page.evaluate(()=>caches.keys())).includes('dqm3-v50'));
  legacy=false;
  // The existing v50 update button must load the new split-script deployment.
  await Promise.all([page.waitForEvent('load'),page.locator('#safe-app-update').click()]);
  await page.waitForFunction(()=>document.querySelector('#acquiredFilter')&&document.querySelector('#status').textContent.includes('526'));
  await page.waitForFunction(async()=>!!(await (await caches.open('dqm3-v52')).match('./storage.js?v=52')));
  await page.reload();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('526'));
  assert.equal(await page.locator('#acquiredCount').innerText(),'入手済み 1/526');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('dqm3-plan-v2'))),{target:'キングスライム',checked:{},routes:{},minRankEnabled:true,minRank:'D'});
  assert(!(await page.evaluate(()=>caches.keys())).includes('dqm3-v50'));
  await context.setOffline(true);await page.reload();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('526'));assert.equal(await page.locator('#acquiredCount').innerText(),'入手済み 1/526');
  await page.locator('#planTab').click();assert(await page.locator('.auto-rank-badge').count()>0);assert.deepEqual(errors,[]);
  console.log('PASS v50 update button -> v52, legacy cache cleanup, exact storage preservation and offline plan');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
