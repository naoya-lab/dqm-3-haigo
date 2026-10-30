const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(){
  const values=new Map();let fail=false;
  const element={addEventListener(){}};
  const context=vm.createContext({console,Set,Map,Date,JSON,Number,Object,Error,SyntaxError,
    document:{getElementById(){return element}},window:{},
    localStorage:{getItem:k=>values.get(k)??null,removeItem:k=>values.delete(k),setItem(k,v){if(fail){fail=false;throw Error('QuotaExceededError')}values.set(k,v)}},
  });
  vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../storage.js'),'utf8'),context);
  return {values,run:code=>vm.runInContext(code,context),fail:()=>{fail=true}};
}
test('backup round trip preserves exact old strings and unrelated keys',()=>{
  const c=setup();
  c.values.set('dqm3-plan-v2','{ "target":"スライム", "checked":{"スライム::0":true}, "routes":{}, "minRank":"D", "minRankEnabled":false }');
  c.values.set('dqm3-saved-plans-v1',JSON.stringify([{target:'キングスライム',checked:{},routes:{}}]));
  c.values.set('dqm3-acquired-monsters-v1','["スライム","旧データの名前"]');
  c.values.set('dqm3-plan-panel-expanded-v1','false');
  c.values.set('dqm3-recommend-panel-expanded-v1','true');
  c.values.set('dqm4-plan-v2','leave alone');
  const before=new Map(c.values);
  c.run('globalThis.backup=JSON.stringify(createBackup()); globalThis.entries=parseBackup(backup)');
  c.values.set('dqm3-plan-v2','{}');
  c.run('restoreBackupEntries(entries)');
  assert.deepEqual(c.values,before);
});
test('rejects invalid/foreign/future/partial payloads without touching storage',()=>{
  const c=setup();c.values.set('dqm3-acquired-monsters-v1','["スライム"]');const before=new Map(c.values);
  for(const mutate of ["b.format='other'","b.version=2","delete b.storage['dqm3-plan-v2']","b.storage.extra='null'","b.storage['dqm3-plan-v2']='null'","b.storage['dqm3-plan-v2']=JSON.stringify({target:'x',routes:{x:-1}})","b.storage['dqm3-plan-v2']=JSON.stringify({target:'x',checked:[]})","b.storage['dqm3-plan-v2']=JSON.stringify({target:'x',minRank:'Z'})","b.storage['dqm3-saved-plans-v1']=JSON.stringify(Array(17).fill({target:'x'}))","b.storage['dqm3-acquired-monsters-v1']='[{}]'","b.storage['dqm3-plan-panel-expanded-v1']='{}'"]){
    assert.throws(()=>c.run(`{const b=createBackup();${mutate};parseBackup(JSON.stringify(b));}`));
    assert.deepEqual(c.values,before);
  }
  assert.throws(()=>c.run("parseBackup('{invalid')"));
});
test('failed restore rolls back all changed keys',()=>{
  const c=setup();c.values.set('dqm3-plan-v2','{"target":"old","checked":{},"routes":{}}');c.values.set('dqm3-acquired-monsters-v1','["old"]');
  c.run(`globalThis.b=createBackup();b.storage['dqm3-plan-v2']='{"target":"new"}';b.storage['dqm3-acquired-monsters-v1']='["new"]';globalThis.entries=parseBackup(JSON.stringify(b))`);
  const before=new Map(c.values);c.fail();assert.throws(()=>c.run('restoreBackupEntries(entries)'),/元の保存データは維持/);assert.deepEqual(c.values,before);
});
test('null entries restore absent keys without clearing other apps',()=>{
  const c=setup();c.run('globalThis.entries=parseBackup(JSON.stringify(createBackup()))');c.values.set('dqm3-plan-v2','{}');c.values.set('other','keep');c.run('restoreBackupEntries(entries)');assert.deepEqual([...c.values],[['other','keep']]);
});
