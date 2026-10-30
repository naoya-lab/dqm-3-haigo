// Classic scripts share the existing global scope; see DEVELOPING.md for load order.
const PLAN_KEY='dqm3-plan-v2';
const SAVED_PLANS_KEY='dqm3-saved-plans-v1';
const MAX_SAVED_PLANS=16;
const PLAN_PANEL_KEY='dqm3-plan-panel-expanded-v1';
const RECOMMEND_PANEL_KEY='dqm3-recommend-panel-expanded-v1';
const ACQUIRED_MONSTERS_KEY='dqm3-acquired-monsters-v1';

let planPanelExpanded=true;
let recommendPanelExpanded=true;
let planView='current';
let savedPlans=[];
let acquiredMonsters=new Set();

let planState={
  target:'',
  checked:{},
  routes:{},
  minRankEnabled:false,
  minRank:'D'
};

function loadAcquiredMonsters(){
  try{
    const saved=localStorage.getItem(ACQUIRED_MONSTERS_KEY);
    const parsed=saved ? JSON.parse(saved) : [];
    acquiredMonsters=new Set(
      Array.isArray(parsed)
        ? parsed.filter(Boolean)
        : []
    );
  }
  catch(error){
    console.warn(error);
    acquiredMonsters=new Set();
  }

  updateAcquiredCount();
}

function saveAcquiredMonsters(){
  try{
    localStorage.setItem(
      ACQUIRED_MONSTERS_KEY,
      JSON.stringify(
        [...acquiredMonsters]
          .sort((a,b)=>a.localeCompare(b,'ja'))
      )
    );
  }
  catch(error){
    console.warn(error);
  }
}

function loadPlanState(){
  try{
    const saved=
      localStorage.getItem(
        PLAN_KEY
      );

    if(saved){
      planState={
        ...planState,
        ...JSON.parse(saved)
      };
    }
  }
  catch(error){
    console.warn(error);
  }
}

function savePlanState(){
  localStorage.setItem(
    PLAN_KEY,
    JSON.stringify(planState)
  );
}

function loadRecommendPanelState(){
  try{
    const saved=localStorage.getItem(RECOMMEND_PANEL_KEY);
    if(saved!==null){
      recommendPanelExpanded=saved==='true';
    }
  }
  catch(error){
    console.warn(error);
  }
}

function saveRecommendPanelState(){
  try{
    localStorage.setItem(
      RECOMMEND_PANEL_KEY,
      String(recommendPanelExpanded)
    );
  }
  catch(error){
    console.warn(error);
  }
}

function updateRecommendPanelVisibility(){
  const isRecommend=mode==='recommend';

  recommendPanelToggle.hidden=!isRecommend;

  if(!isRecommend){
    recommendControls.hidden=true;
    return;
  }

  recommendPanelToggle.textContent=
    recommendPanelExpanded
      ? '▲ 編成条件を収納'
      : '▼ 編成条件を展開';

  recommendPanelToggle.setAttribute(
    'aria-expanded',
    recommendPanelExpanded?'true':'false'
  );

  recommendControls.hidden=
    !recommendPanelExpanded;
}

function loadPlanPanelState(){
  try{
    const saved=localStorage.getItem(PLAN_PANEL_KEY);
    if(saved!==null){
      planPanelExpanded=saved==='true';
    }
  }
  catch(error){
    console.warn(error);
  }
}

function savePlanPanelState(){
  try{
    localStorage.setItem(
      PLAN_PANEL_KEY,
      String(planPanelExpanded)
    );
  }
  catch(error){
    console.warn(error);
  }
}

function updatePlanPanelVisibility(){
  const isPlan=mode==='plan';

  planPanelToggle.hidden=!isPlan;

  if(!isPlan){
    planControls.hidden=true;
    planSubtabs.hidden=true;
    return;
  }

  planPanelToggle.textContent=
    planPanelExpanded
      ? '▲ 操作パネルを収納'
      : '▼ 操作パネルを展開';

  planPanelToggle.setAttribute(
    'aria-expanded',
    planPanelExpanded?'true':'false'
  );

  if(!planPanelExpanded){
    planControls.hidden=true;
    planSubtabs.hidden=true;
    return;
  }

  planControls.hidden=
    planView==='saved'
    ||planView==='materials';

  planSubtabs.hidden=false;
}

function loadSavedPlans(){
  try{
    const saved=localStorage.getItem(SAVED_PLANS_KEY);
    const parsed=saved ? JSON.parse(saved) : [];
    savedPlans=Array.isArray(parsed)
      ? parsed.slice(0,MAX_SAVED_PLANS)
      : [];
  }
  catch(error){
    console.warn(error);
    savedPlans=[];
  }
}

function saveSavedPlans(){
  localStorage.setItem(
    SAVED_PLANS_KEY,
    JSON.stringify(savedPlans)
  );
  updatePlanSavedTabLabel();
}

function updatePlanSavedTabLabel(){
  if(planSavedTab){
    planSavedTab.textContent=
      `保存ルート ${savedPlans.length}/${MAX_SAVED_PLANS}`;
  }
}


// Versioned envelope; storage values remain byte-for-byte compatible with v50.
// Future formats must explicitly migrate here before any localStorage writes.
const BACKUP_FORMAT='dqm3-haigo-backup';
const BACKUP_VERSION=1;
const BACKUP_KEYS=[PLAN_KEY,SAVED_PLANS_KEY,ACQUIRED_MONSTERS_KEY,PLAN_PANEL_KEY,RECOMMEND_PANEL_KEY];
const MAX_BACKUP_BYTES=10*1024*1024;

function backupObject(value){
  return value!==null && typeof value==='object' && !Array.isArray(value);
}

function validateBackupPlan(value){
  if(!backupObject(value) || typeof value.target!=='string') throw new Error('配合計画の形式が不正です');
  const fields=['target','checked','routes','minRankEnabled','minRank','savedAt'];
  if(Object.keys(value).some(key=>!fields.includes(key))) throw new Error('対応していない配合計画の項目があります');
  for(const field of ['checked','routes']){
    if(value[field]===undefined) continue; // Older plans may omit optional fields.
    if(!backupObject(value[field])) throw new Error('配合計画の形式が不正です');
    for(const [key,item] of Object.entries(value[field])){
      if(['__proto__','constructor','prototype'].includes(key)
        || (field==='checked' ? typeof item!=='boolean' : !Number.isSafeInteger(item)||item<0)){
        throw new Error('チェック状態・ルートの形式が不正です');
      }
    }
  }
  if(value.minRankEnabled!==undefined && typeof value.minRankEnabled!=='boolean') throw new Error('最低ランク設定が不正です');
  if(value.minRank!==undefined && !['G','F','E','D','C','B','A','S','X'].includes(value.minRank)) throw new Error('最低ランク設定が不正です');
  if(value.savedAt!==undefined && (!Number.isFinite(value.savedAt)||value.savedAt<0)) throw new Error('保存日時が不正です');
}

function parseBackup(text){
  const backup=JSON.parse(text);
  if(!backupObject(backup) || backup.format!==BACKUP_FORMAT) throw new Error('DQM3のバックアップファイルではありません');
  if(backup.version!==BACKUP_VERSION) throw new Error('このバックアップのバージョンには対応していません');
  const entries=backup.storage;
  if(!backupObject(entries) || Object.keys(entries).length!==BACKUP_KEYS.length
    || BACKUP_KEYS.some(key=>!Object.prototype.hasOwnProperty.call(entries,key))){
    throw new Error('保存項目が不足しているか、対応していない項目があります');
  }
  for(const key of BACKUP_KEYS){
    const raw=entries[key];
    if(raw===null) continue;
    if(typeof raw!=='string') throw new Error('保存値の形式が不正です');
    const value=JSON.parse(raw);
    if(key===PLAN_KEY) validateBackupPlan(value);
    else if(key===SAVED_PLANS_KEY){
      if(!Array.isArray(value)||value.length>MAX_SAVED_PLANS) throw new Error('保存ルートの形式が不正です');
      value.forEach(validateBackupPlan);
    }
    else if(key===ACQUIRED_MONSTERS_KEY){
      if(!Array.isArray(value)||value.some(name=>typeof name!=='string'||!name)) throw new Error('入手済みデータの形式が不正です');
    }
    else if(typeof value!=='boolean') throw new Error('折りたたみ設定の形式が不正です');
  }
  return entries;
}

function createBackup(){
  return {
    format:BACKUP_FORMAT,
    version:BACKUP_VERSION,
    createdAt:new Date().toISOString(),
    storage:Object.fromEntries(BACKUP_KEYS.map(key=>[key,localStorage.getItem(key)]))
  };
}

function restoreBackupEntries(entries){
  const previous=Object.fromEntries(BACKUP_KEYS.map(key=>[key,localStorage.getItem(key)]));
  const changed=[];
  try{
    // Remove first to release quota when replacing a large backup. No unrelated keys are touched.
    for(const key of BACKUP_KEYS){
      if(previous[key]===entries[key]) continue;
      localStorage.removeItem(key);
      changed.push(key);
    }
    for(const key of changed){
      if(entries[key]!==null) localStorage.setItem(key,entries[key]);
    }
  }
  catch(error){
    try{
      for(const key of changed) localStorage.removeItem(key);
      for(const key of changed){
        if(previous[key]!==null) localStorage.setItem(key,previous[key]);
      }
    }
    catch(rollbackError){
      throw new Error('復元と元データへの復帰に失敗しました。画面を閉じず、現在のデータをバックアップしてください。');
    }
    throw new Error('復元できませんでした。元の保存データは維持されています。端末の空き容量・保存設定を確認してください。');
  }
}

const backupStatus=document.getElementById('backupStatus');
const backupFile=document.getElementById('backupFile');
document.getElementById('exportBackup').addEventListener('click',()=>{
  let url;
  try{
    const backup=createBackup();
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
    url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;
    link.download='dqm3-backup-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.append(link);
    link.click();
    link.remove();
    backupStatus.textContent='バックアップの保存を開始しました。端末のダウンロード先を確認してください。';
  }
  catch(error){backupStatus.textContent='バックアップを保存できませんでした。端末の保存設定を確認してください。';}
  finally{if(url) setTimeout(()=>URL.revokeObjectURL(url),30000);}
});
document.getElementById('importBackup').addEventListener('click',()=>backupFile.click());
backupFile.addEventListener('change',async()=>{
  const file=backupFile.files[0];
  backupFile.value=''; // Allow retrying the same file.
  if(!file) return;
  const button=document.getElementById('importBackup');
  button.disabled=true;
  try{
    if(file.size>MAX_BACKUP_BYTES) throw new Error('ファイルが大きすぎます（最大10MB）');
    const entries=parseBackup(await file.text());
    if(!confirm('DQM3の入手済み・配合計画・保存ルート・設定をバックアップの内容に置き換えます。現在のデータは先にバックアップすることをおすすめします。復元しますか？')){
      backupStatus.textContent='復元をキャンセルしました。';
      return;
    }
    restoreBackupEntries(entries);
    // Reload resets absent keys to the same defaults as a normal cold start.
    location.reload();
  }
  catch(error){backupStatus.textContent='復元できませんでした：'+(error instanceof SyntaxError?'JSONの形式が不正です。':error.message);}
  finally{button.disabled=false;}
});
