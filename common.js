// Classic scripts share the existing global scope; see DEVELOPING.md for load order.
let DB={monsters:[]};
let SKILL_DB={skills:[]};
let ABILITY_DETAILS={};
let TRAIT_DETAILS={};
let MONSTER_RECOMMENDATIONS={};
let mode='monster';
let monsterSearchValue='';
let planReturnScrollY=0;
let skillSearchValue='';
let STAT_THRESHOLDS={};

const q=document.getElementById('q');
const results=document.getElementById('results');
const statusEl=document.getElementById('status');
const net=document.getElementById('net');
const monsterTab=document.getElementById('monsterTab');
const skillTab=document.getElementById('skillTab');
const planTab=document.getElementById('planTab');
const recommendTab=document.getElementById('recommendTab');
const sortSelect=document.getElementById('sortSelect');
const sortDirection=document.getElementById('sortDirection');
const filterToggle=document.getElementById('filterToggle');
const monsterFilters=document.getElementById('monsterFilters');
const rankFilters=document.getElementById('rankFilters');
const familyFilters=document.getElementById('familyFilters');
const clearFilters=document.getElementById('clearFilters');
const sortRow=document.getElementById('sortRow');
const normalSearch=document.getElementById('normalSearch');
const acquiredCount=document.getElementById('acquiredCount');
const planControls=document.getElementById('planControls');
const recommendControls=document.getElementById('recommendControls');
const recommendPanelToggle=document.getElementById('recommendPanelToggle');
const recommendTarget=document.getElementById('recommendTarget');
const recommendStrategy=document.getElementById('recommendStrategy');
const recommendFormation=document.getElementById('recommendFormation');
const planTarget=document.getElementById('planTarget');
const buildPlanButton=document.getElementById('buildPlan');
const monsterOptions=document.getElementById('monsterOptions');
const planSubtabs=document.getElementById('planSubtabs');
const planCurrentTab=document.getElementById('planCurrentTab');
const planSavedTab=document.getElementById('planSavedTab');
const planMaterialsTab=document.getElementById('planMaterialsTab');
const planPanelToggle=document.getElementById('planPanelToggle');
const planMinRankEnabled=document.getElementById('planMinRankEnabled');
const planMinRank=document.getElementById('planMinRank');

function esc(s){
  return String(s??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[c]));
}

function norm(s){
  return String(s??'')
    .toLowerCase()
    .replace(/[\s\u30fb\uff65\u30fc]/g,'');
}

function traitDetail(name){
  const key=String(name||'');
  return (
    TRAIT_DETAILS[key]
    ||TRAIT_DETAILS[key.replace(/～/g,'〜')]
    ||TRAIT_DETAILS[key.replace(/〜/g,'～')]
    ||null
  );
}

function findMonster(name){
  return DB.monsters.find(m=>m.name===name);
}

function imgUrl(name){
  return 'https://www.google.com/search?tbm=isch&q='
    +encodeURIComponent('DQM3 '+name);
}

function jumpMonster(name){
  if(mode==='plan'){
    planReturnScrollY=window.scrollY||0;
  }

  monsterSearchValue=name;
  mode='monster';
  updateTabs();
  q.value=monsterSearchValue;
  render();
  scrollTo({top:0,behavior:'smooth'});
}

function jumpSkill(name){
  skillSearchValue=name;
  mode='skill';
  updateTabs();
  q.value=skillSearchValue;
  render();
  scrollTo({top:0,behavior:'smooth'});
}

function jumpToPlan(name){
  if(!findMonster(name)) return;

  planState.target=name;
  planState.checked={};
  planState.routes={};
  savePlanState();

  mode='plan';
  updateTabs();
  planTarget.value=name;
  renderPlan();
  scrollTo({top:0,behavior:'smooth'});
}

window.jumpMonster=jumpMonster;
window.jumpSkill=jumpSkill;
window.jumpToPlan=jumpToPlan;

function monsterButton(name){
  return `
    <button class="jump"
      onclick='jumpMonster(${JSON.stringify(name)})'>
      ${esc(name)}
    </button>
  `;
}

function skillButton(name){
  return `
    <button class="jump skilljump"
      onclick='jumpSkill(${JSON.stringify(name)})'>
      ${esc(name)}
    </button>
  `;
}

