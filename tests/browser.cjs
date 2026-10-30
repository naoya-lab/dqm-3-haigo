// Requires Playwright from the development environment, not from the deployed app.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const origin=process.env.DQM_TEST_ORIGIN||'http://127.0.0.1:8000';
const keys=['dqm3-plan-v2','dqm3-saved-plans-v1','dqm3-acquired-monsters-v1','dqm3-plan-panel-expanded-v1','dqm3-recommend-panel-expanded-v1'];
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const ready=async()=>page.waitForFunction(()=>document.querySelector('#status').textContent.includes('526'));
 const storage=()=>page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),keys);
 try{
  await page.goto(origin);await ready();
  const legacy={'dqm3-plan-v2':JSON.stringify({target:'キングスライム',checked:{'キングスライム::0.0':true},routes:{},minRankEnabled:false,minRank:'D'}),'dqm3-saved-plans-v1':JSON.stringify([{target:'スライムナイト',checked:{},routes:{},minRankEnabled:false,minRank:'D',savedAt:100}]),'dqm3-acquired-monsters-v1':'["スライム","キングスライム"]','dqm3-plan-panel-expanded-v1':'true','dqm3-recommend-panel-expanded-v1':'false'};
  await page.evaluate(entries=>{for(const [k,v]of Object.entries(entries))localStorage.setItem(k,v);localStorage.setItem('dqm4-sentinel','keep');localStorage.setItem('unrelated','keep')},legacy);
  await page.reload();await ready();assert.deepEqual(await storage(),legacy);assert.equal(await page.locator('#acquiredCount').innerText(),'入手済み 2/526');
  console.log('PASS legacy storage reload and count');
  await page.locator('#filterToggle').click();await page.locator('#acquiredFilter').selectOption('acquired');
  assert.equal(await page.locator('.monster-acquired input').count(),2);
  await page.locator('#rankFilters input[value="D"]').check();assert.equal(await page.locator('.monster-acquired input').count(),1);
  await page.locator('#familyFilters input').first().check();
  const expected=await page.evaluate(()=>DB.monsters.filter(monsterMatchesFilters).length);assert.equal(await page.locator('.monster-acquired input').count(),expected);
  await page.locator('#clearFilters').click();await page.locator('#acquiredFilter').selectOption('missing');assert.equal(await page.locator('.monster-acquired input').count(),524);
  const first=page.locator('.monster-acquired input').first();await first.click();assert.equal(await page.locator('.monster-acquired input').count(),523);
  await page.locator('#clearFilters').click();await page.locator('#q').fill('スライム');assert.match(await page.locator('#results').innerText(),/スライム/);await page.locator('#q').fill('');
  for(const value of ['number','name','rank','family','hp','mp','attack','defence','agility','wisdom']){
   await page.locator('#sortSelect').selectOption(value);
   const matches=await page.evaluate(()=>{const expected=[...DB.monsters].sort((a,b)=>compareMonsters(a,b,''));return [...document.querySelectorAll('.monster-acquired input')].every((el,i)=>el.dataset.acquiredName===expected[i].name)});assert(matches,value);
  }
  await page.locator('#sortDirection').selectOption('desc');
  await page.locator('#skillTab').click();await page.locator('#q').fill('メラ');assert(!/該当する/.test(await page.locator('#results').innerText()));
  console.log('PASS filters, acquired changes, monster/skill search, all sort fields');
  await page.locator('#planTab').click();assert.match(await page.locator('#status').innerText(),/キングスライム/);
  assert(await page.locator('.acquired-badge').count()>0);
  const statsBefore=await page.evaluate(()=>{const stats={total:0,checked:0,leaves:{}};collectPlanStats(buildPlanNode(planState.target),stats);return stats});
  await page.evaluate(()=>{acquiredMonsters.add('もりもりスライム');renderPlan()});
  const statsAfter=await page.evaluate(()=>{const stats={total:0,checked:0,leaves:{}};collectPlanStats(buildPlanNode(planState.target),stats);return stats});assert.deepEqual(statsAfter,statsBefore);
  await page.locator('#planMinRankEnabled').check();assert(await page.locator('.auto-rank-badge').count()>0);assert(await page.locator('.is-auto-checked input:disabled').count()>0);await page.locator('#planMinRankEnabled').uncheck();
  await page.evaluate(()=>{planState={target:'竜王',checked:{},routes:{},minRankEnabled:false,minRank:'D'};savePlanState();renderPlan()});
  await page.locator('.plan-tree').evaluate(el=>el.scrollLeft=100);
  const check=page.locator('.plan-check:not(:disabled)').nth(2);await check.scrollIntoViewIfNeeded();
  const before=await page.evaluate(()=>({x:document.querySelector('.plan-tree').scrollLeft,y:scrollY}));
  await check.evaluate(el=>{el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}))});await page.waitForTimeout(100);
  const after=await page.evaluate(()=>({x:document.querySelector('.plan-tree').scrollLeft,y:scrollY}));assert(Math.abs(before.x-after.x)<=1);assert(Math.abs(before.y-after.y)<=1,JSON.stringify({before,after}));assert(await page.locator('.manual-check-badge').count()>0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page should not scroll horizontally');
  await page.screenshot({path:'/tmp/dqm3-plan-mobile.png',fullPage:false});
  // Exercise route changes using a monster with multiple registered recipes.
  await page.evaluate(()=>{const m=DB.monsters.find(m=>m.recipes?.length>1);planState={target:m.name,checked:{},routes:{},minRankEnabled:false,minRank:'D'};renderPlan()});
  const route=page.locator('.route-select').first();await route.selectOption('1');assert(Object.values(await page.evaluate(()=>planState.routes)).includes(1));
  const duplicateMaterials=await page.evaluate(()=>{
    const original=planState;const originalSaved=savedPlans;
    try{planState={target:'キングスライム',checked:{},routes:{},minRankEnabled:true,minRank:'G'};
      savedPlans=[{target:'スライム',checked:{},routes:{}},{target:'バーガースライム',checked:{},routes:{}}];
      planState.minRankEnabled=false;
      const totals=collectSavedPlanMaterials();
      planState.minRankEnabled=true;
      const excluded=collectSavedPlanMaterials();
      return {totals,excluded};
    }finally{planState=original;savedPlans=originalSaved}
  });
  assert.deepEqual(duplicateMaterials.totals,{'スライム':1,'バーガースライム':1});
  assert.deepEqual(duplicateMaterials.excluded,{});
  await page.evaluate(()=>{savedPlans=[];for(const m of DB.monsters.slice(0,17)){planState={target:m.name,checked:{},routes:{},minRankEnabled:false,minRank:'D'};saveCurrentPlanToSlot()}});
  assert.equal(await page.evaluate(()=>savedPlans.length),16);await page.locator('#planMaterialsTab').click();assert((await page.locator('#results').innerText()).length>0);await page.locator('#planSavedTab').click();assert.match(await page.locator('#results').innerText(),/スライム/);await page.evaluate(()=>openSavedPlan(0));assert.match(await page.locator('#status').innerText(),/スライム/);
  await page.locator('#recommendTab').click();await page.locator('#recommendPanelToggle').click();await page.locator('#recommendStrategy').selectOption('power');assert((await page.locator('#results').innerText()).length>100);
  console.log('PASS plan ownership separate from counts, manual/auto checks, scroll, route choice, 16 saved routes and totals, recommendations');
  await page.locator('.data-settings summary').click();
  const current=await storage();const downloadPromise=page.waitForEvent('download');await page.locator('#exportBackup').click();const download=await downloadPromise;const backup=await fs.readFile(await download.path(),'utf8');assert.deepEqual(JSON.parse(backup).storage,current);
  const upload=async text=>page.locator('#backupFile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(text)});
  await upload('{invalid');await page.waitForFunction(()=>document.querySelector('#backupStatus').textContent.includes('JSON'));assert.deepEqual(await storage(),current);
  await upload(JSON.stringify({format:'other',version:1}));await page.waitForFunction(()=>document.querySelector('#backupStatus').textContent.includes('ではありません'));assert.deepEqual(await storage(),current);
  page.once('dialog',d=>d.dismiss());await upload(backup);await page.waitForFunction(()=>document.querySelector('#backupStatus').textContent.includes('キャンセル'));assert.deepEqual(await storage(),current);
  await page.evaluate(()=>localStorage.setItem('dqm3-acquired-monsters-v1','[]'));
  page.once('dialog',d=>d.accept());await Promise.all([page.waitForEvent('load'),upload(backup)]);await ready();assert.deepEqual(await storage(),current);assert.equal(await page.evaluate(()=>localStorage.getItem('dqm4-sentinel')),'keep');assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated')),'keep');
  console.log('PASS actual download/upload, malformed/foreign/cancelled restore, complete round trip, unrelated data preserved');
  await page.evaluate(async()=>{await navigator.serviceWorker.ready});await page.reload();await ready();
  const core=await page.evaluate(async()=>{const c=await caches.open('dqm3-v52');return (await c.keys()).map(r=>new URL(r.url).pathname)});for(const n of ['app','common','monsters','skills','recommend','storage','plan'])assert(core.includes('/'+n+'.js'));
  await context.setOffline(true);await page.reload();await ready();await page.locator('#q').fill('スライム');assert.match(await page.locator('#results').innerText(),/スライム/);await context.setOffline(false);
  assert.deepEqual(errors,[]);console.log('PASS service worker precache, offline reload and search, zero page errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
