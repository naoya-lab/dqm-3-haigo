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

function updateAcquiredCount(){
  if(!acquiredCount) return;

  const total=
    DB?.monsters?.length
    ||526;

  acquiredCount.textContent=
    `入手済み ${acquiredMonsters.size}/${total}`;

  acquiredCount.hidden=
    mode!=='monster';
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

function setMonsterAcquired(name,checked){
  if(!name) return;

  if(checked){
    acquiredMonsters.add(name);
  }
  else{
    acquiredMonsters.delete(name);
  }

  saveAcquiredMonsters();
  updateAcquiredCount();
}

window.toggleMonsterAcquired=
  function(name,checked){
    setMonsterAcquired(name,checked);

    document
      .querySelectorAll(
        'input[data-acquired-name]'
      )
      .forEach(input=>{
        if(input.dataset.acquiredName===name){
          input.checked=checked;
        }
      });
  };

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

