// Classic scripts share the existing global scope; see DEVELOPING.md for load order.
function updateTabs(){
  monsterTab.classList.toggle(
    'active',
    mode==='monster'
  );

  skillTab.classList.toggle(
    'active',
    mode==='skill'
  );

  planTab.classList.toggle(
    'active',
    mode==='plan'
  );

  recommendTab.classList.toggle(
    'active',
    mode==='recommend'
  );

  const isPlan=
    mode==='plan';

  const isRecommend=
    mode==='recommend';

  normalSearch.hidden=
    isPlan
    ||isRecommend;

  updatePlanPanelVisibility();

  updateRecommendPanelVisibility();
  updateAcquiredCount();

  if(mode==='monster'){
    q.placeholder=
      '\u30e2\u30f3\u30b9\u30bf\u30fc\u540d\u30fb\u30b9\u30ad\u30eb\u30fb\u7279\u6027\u30fb\u751f\u606f\u5730\u30fb\u5375\u3092\u5165\u529b';

    sortRow.style.display=
      'flex';
  }

  if(mode==='skill'){
    q.placeholder=
      '\u30b9\u30ad\u30eb\u540d\u30fb\u7279\u6280\u540d\u3092\u5165\u529b';

    sortRow.style.display=
      'none';
    monsterFilters.hidden=true;
    filterToggle.textContent='▶ 絞り込み';
    filterToggle.setAttribute('aria-expanded','false');
  }

  if(isPlan){
    planTarget.value=
      planState.target
      ||'';

    planMinRankEnabled.checked=
      Boolean(planState.minRankEnabled);

    planMinRank.value=
      planState.minRank
      ||'D';

    planMinRank.disabled=
      !planState.minRankEnabled;

    updatePlanSubtabs();
  }
}

monsterTab.addEventListener(
  'click',
  ()=>{
    if(mode==='plan'){
      planReturnScrollY=window.scrollY||0;
    }

    mode='monster';
    q.value=monsterSearchValue;
    updateTabs();
    render();
  }
);

skillTab.addEventListener(
  'click',
  ()=>{
    mode='skill';
    q.value=skillSearchValue;
    updateTabs();
    render();
  }
);

planTab.addEventListener(
  'click',
  ()=>{
    mode='plan';
    planView='current';
    updateTabs();
    render();

    requestAnimationFrame(()=>{
      scrollTo({
        top:planReturnScrollY||0,
        behavior:'auto'
      });
    });
  }
);

planCurrentTab.addEventListener(
  'click',
  ()=>{
    planView='current';
    updateTabs();
    updatePlanPanelVisibility();
    renderPlan();
  }
);

planSavedTab.addEventListener(
  'click',
  ()=>{
    planView='saved';
    updateTabs();
    updatePlanPanelVisibility();
    renderSavedPlans();
  }
);

planMaterialsTab.addEventListener(
  'click',
  ()=>{
    planView='materials';
    updateTabs();
    updatePlanPanelVisibility();
    renderSavedMaterialTotals();
  }
);

planPanelToggle.addEventListener(
  'click',
  ()=>{
    planPanelExpanded=!planPanelExpanded;
    savePlanPanelState();
    updatePlanPanelVisibility();
  }
);

recommendPanelToggle.addEventListener(
  'click',
  ()=>{
    recommendPanelExpanded=!recommendPanelExpanded;
    saveRecommendPanelState();
    updateRecommendPanelVisibility();
  }
);

recommendTab.addEventListener(
  'click',
  ()=>{
    mode='recommend';
    updateTabs();
    render();
  }
);

recommendTarget.addEventListener(
  'change',
  render
);

recommendStrategy.addEventListener(
  'change',
  render
);

recommendFormation.addEventListener(
  'change',
  render
);

buildPlanButton.addEventListener(
  'click',
  createPlan
);

planMinRankEnabled.addEventListener(
  'change',
  ()=>{
    const willEnable=
      planMinRankEnabled.checked;

    if(
      planState.minRankEnabled
      &&!willEnable
    ){
      preserveAutoRankChecks();
    }

    planState.minRankEnabled=
      willEnable;

    planMinRank.disabled=
      !planState.minRankEnabled;

    savePlanState();

    if(mode==='plan' && planView==='current'){
      renderPlan();
    }
  }
);

planMinRank.addEventListener(
  'change',
  ()=>{
    planState.minRank=
      planMinRank.value;

    savePlanState();

    if(mode==='plan' && planView==='current'){
      renderPlan();
    }
  }
);

planTarget.addEventListener(
  'keydown',
  event=>{
    if(event.key==='Enter'){
      createPlan();
    }
  }
);

function render(){
  if(mode==='monster'){
    renderMonsters();
    return;
  }

  if(mode==='skill'){
    renderSkills();
    return;
  }

  if(mode==='recommend'){
    renderRecommendations();
    return;
  }

  if(planView==='saved'){
    renderSavedPlans();
    return;
  }

  if(planView==='materials'){
    renderSavedMaterialTotals();
    return;
  }

  renderPlan();
}

q.addEventListener(
  'input',
  ()=>{
    if(mode==='monster'){
      monsterSearchValue=q.value;
    }
    else if(mode==='skill'){
      skillSearchValue=q.value;
    }
    render();
  }
);

sortSelect.addEventListener(
  'change',
  render
);

sortDirection.addEventListener(
  'change',
  render
);

filterToggle.addEventListener(
  'click',
  ()=>{
    const willOpen=monsterFilters.hidden;
    monsterFilters.hidden=!willOpen;
    filterToggle.textContent=
      (willOpen?'▼':'▶')+' 絞り込み';
    filterToggle.setAttribute(
      'aria-expanded',
      willOpen?'true':'false'
    );
  }
);

rankFilters.addEventListener(
  'change',
  render
);

familyFilters.addEventListener(
  'change',
  render
);

clearFilters.addEventListener(
  'click',
  ()=>{
    [
      ...rankFilters.querySelectorAll('input[type="checkbox"]'),
      ...familyFilters.querySelectorAll('input[type="checkbox"]')
    ].forEach(input=>{
      input.checked=false;
    });
    render();
  }
);

function updateNet(){
  net.textContent=
    navigator.onLine
      ? '\u30aa\u30f3\u30e9\u30a4\u30f3'
      : '\u30aa\u30d5\u30e9\u30a4\u30f3';
}

addEventListener(
  'online',
  updateNet
);

addEventListener(
  'offline',
  updateNet
);

updateNet();
loadPlanState();
loadSavedPlans();
loadAcquiredMonsters();
loadPlanPanelState();
loadRecommendPanelState();

Promise.all([
  fetch(
    './data.json?v=51',
    {
      cache:'no-store'
    }
  )
  .then(response=>{
    if(!response.ok){
      throw new Error(
        'data.json'
      );
    }
    return response.json();
  }),

  fetch(
    './skills.json?v=51',
    {
      cache:'no-store'
    }
  )
  .then(response=>{
    if(!response.ok){
      throw new Error(
        'skills.json'
      );
    }
    return response.json();
  }),

  fetch(
    './ability_details.json?v=51',
    {
      cache:'no-store'
    }
  )
  .then(response=>{
    if(!response.ok){
      throw new Error(
        'ability_details.json'
      );
    }
    return response.json();
  }),

  fetch(
    './trait_details.json?v=51',
    {
      cache:'no-store'
    }
  )
  .then(response=>{
    if(!response.ok){
      throw new Error(
        'trait_details.json'
      );
    }
    return response.json();
  }),

  fetch(
    './monster_recommendations.json?v=51',
    {
      cache:'no-store'
    }
  )
  .then(response=>{
    if(!response.ok){
      throw new Error(
        'monster_recommendations.json'
      );
    }
    return response.json();
  })
])
.then(
  ([
    monsterData,
    skillData,
    abilityDetailData,
    traitDetailData,
    recommendationData
  ])=>{
    DB=monsterData;
    SKILL_DB=skillData;
    ABILITY_DETAILS=abilityDetailData.abilities||{};
    TRAIT_DETAILS=traitDetailData.traits||{};
    MONSTER_RECOMMENDATIONS=recommendationData.recommendations||{};
    prepareStatThresholds();
    renderMonsterFilters();

    monsterOptions.innerHTML=
      DB.monsters
        .map(
          monster=>`
            <option
              value="${esc(monster.name)}"
            ></option>
          `
        )
        .join('');

    updateTabs();
    render();
  }
)
.catch(error=>{
  console.error(error);

  statusEl.textContent=
    '\u30c7\u30fc\u30bf\u8aad\u307f\u8fbc\u307f\u30a8\u30e9\u30fc';

  results.innerHTML=`
    <div class="empty">
      data.json\u30fbskills.json\u30fbability_details.json\u30fbtrait_details.json \u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002
    </div>
  `;
});

if('serviceWorker' in navigator){
  navigator.serviceWorker
    .register(
      './sw.js?v=51'
    )
    .catch(error=>
      console.warn(
        'Service Worker error',
        error
      )
    );
}
