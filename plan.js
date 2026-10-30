// Classic scripts share the existing global scope; see DEVELOPING.md for load order.
function clonePlanState(value){
  return JSON.parse(JSON.stringify(value));
}

function saveCurrentPlanToSlot(){
  const target=planState.target;

  if(!target || !findMonster(target)){
    statusEl.textContent='保存できる配合計画がありません';
    return;
  }

  const existingIndex=savedPlans.findIndex(
    item=>item.target===target
  );

  const entry={
    target,
    checked:clonePlanState(planState.checked||{}),
    routes:clonePlanState(planState.routes||{}),
    minRankEnabled:Boolean(planState.minRankEnabled),
    minRank:planState.minRank||'D',
    savedAt:Date.now()
  };

  if(existingIndex>=0){
    savedPlans[existingIndex]=entry;
  }
  else{
    if(savedPlans.length>=MAX_SAVED_PLANS){
      statusEl.textContent=
        `保存できるのは最大${MAX_SAVED_PLANS}体までです`;
      return;
    }
    savedPlans.push(entry);
  }

  saveSavedPlans();
  statusEl.textContent=`${target} の作成経路を保存しました`;
  renderPlan();
}

function openSavedPlan(index){
  const saved=savedPlans[index];
  if(!saved) return;

  const restoredMinRankEnabled=
    saved.minRankEnabled===undefined
      ? Boolean(planState.minRankEnabled)
      : Boolean(saved.minRankEnabled);

  const restoredMinRank=
    saved.minRank
    ||planState.minRank
    ||'D';

  planState={
    target:saved.target||'',
    checked:clonePlanState(saved.checked||{}),
    routes:clonePlanState(saved.routes||{}),
    minRankEnabled:restoredMinRankEnabled,
    minRank:restoredMinRank
  };
  savePlanState();

  planView='current';
  mode='plan';
  updateTabs();
  renderPlan();
  scrollTo({top:0,behavior:'smooth'});
}

function deleteSavedPlan(index){
  if(index<0 || index>=savedPlans.length) return;
  savedPlans.splice(index,1);
  saveSavedPlans();
  renderSavedPlans();
}

window.saveCurrentPlanToSlot=saveCurrentPlanToSlot;
window.openSavedPlan=openSavedPlan;
window.deleteSavedPlan=deleteSavedPlan;

function nodeKey(target,path){
  return target+'::'+path;
}

const PLAN_RANK_ORDER={
  G:0,
  F:1,
  E:2,
  D:3,
  C:4,
  B:5,
  A:6,
  S:7,
  X:8
};

function preserveAutoRankChecks(){
  if(
    !planState.minRankEnabled
    ||!planState.target
    ||!findMonster(planState.target)
  ){
    return;
  }

  const root=buildPlanNode(planState.target);

  function visit(node){
    if(
      node.monster
      &&shouldStopAtMinRank(node.monster)
    ){
      planState.checked[node.key]=true;
    }

    (node.children||[]).forEach(visit);
  }

  visit(root);
}

function shouldStopAtMinRank(monster){
  if(!planState.minRankEnabled) return false;

  const monsterRank=
    PLAN_RANK_ORDER[
      String(monster?.rank||'').toUpperCase()
    ];

  const minimumRank=
    PLAN_RANK_ORDER[
      String(planState.minRank||'D').toUpperCase()
    ];

  if(monsterRank===undefined || minimumRank===undefined){
    return false;
  }

  return monsterRank<=minimumRank;
}

function buildPlanNode(
  name,
  path='0',
  stack=[]
){
  const monster=findMonster(name);

  const key=nodeKey(
    planState.target,
    path
  );

  if(!monster){
    return {
      name,
      key,
      monster:null,
      generic:true,
      children:[]
    };
  }

  if(stack.includes(name)){
    return {
      name,
      key,
      monster,
      cycle:true,
      children:[]
    };
  }

  if(shouldStopAtMinRank(monster)){
    return {
      name,
      key,
      monster,
      minRankStop:true,
      children:[]
    };
  }

  const recipes=monster.recipes||[];

  if(!recipes.length){
    return {
      name,
      key,
      monster,
      children:[]
    };
  }

  let routeIndex=
    Number(
      planState.routes[key]
      ??0
    );

  if(routeIndex>=recipes.length){
    routeIndex=0;
  }

  const recipe=recipes[routeIndex];

  const children=(recipe.parents||[])
    .map(
      (parent,index)=>
        buildPlanNode(
          parent,
          `${path}.${index}`,
          [...stack,name]
        )
    );

  return {
    name,
    key,
    monster,
    recipes,
    routeIndex,
    recipe,
    children
  };
}

function shortLocation(monster){
  const locations=
    monster?.locations||[];

  return locations.length
    ? locations[0].name
    : '';
}

function shortEgg(monster){
  const eggs=
    monster?.eggs||[];

  if(!eggs.length){
    return '';
  }

  const egg=eggs[0];

  return (
    `${egg.name}\u306e\u5375`
    +
    (
      egg.postGameOnly
        ? '\uff08\u30af\u30ea\u30a2\u5f8c\uff09'
        : ''
    )
  );
}

function planNodeHtml(node,depth=0){
  const manualChecked=
    Boolean(
      planState.checked[
        node.key
      ]
    );

  const autoChecked=
    Boolean(
      node.monster
      &&shouldStopAtMinRank(node.monster)
    );

  const checked=
    manualChecked
    ||autoChecked;

  const indent=depth;

  const routeSelect=
    (
      node.recipes
      &&
      node.recipes.length>1
    )
      ? `
        <select
          class="route-select"
          onchange='changePlanRoute(
            ${JSON.stringify(node.key)},
            this.value
          )'
        >
          ${
            node.recipes
              .map(
                (recipe,index)=>`
                  <option
                    value="${index}"
                    ${
                      index===node.routeIndex
                        ? 'selected'
                        : ''
                    }
                  >
                    ${esc(
                      (recipe.parents||[])
                        .join(' \uff0b ')
                    )}
                  </option>
                `
              )
              .join('')
          }
        </select>
      `
      : '';

  const location=
    shortLocation(node.monster);

  const egg=
    shortEgg(node.monster);

  return `
    <div
      class="plan-node"
      style="--depth:${indent}"
    >
      <div class="plan-node-head">
        <input
          type="checkbox"
          class="plan-check"
          ${checked?'checked':''}
          ${autoChecked?'disabled':''}
          ${autoChecked?'title="最低ランク以下のため自動チェック"':''}
          onchange='togglePlanCheck(
            ${JSON.stringify(node.key)},
            ${JSON.stringify(node.name)},
            this.checked
          )'
        >

        <button
          class="plan-name"
          onclick='jumpMonster(
            ${JSON.stringify(node.name)}
          )'
          ${!node.monster?'disabled':''}
        >
          ${esc(node.name)}
        </button>

        ${
          node.monster?.rank
            ? `
              <span class="mini-badge">
                ${esc(node.monster.rank)}
              </span>
            `
            : ''
        }

        ${autoChecked ? `
          <span class="mini-badge auto-rank-badge">
            自動チェック
          </span>
        ` : ''}
      </div>

      ${
        location
          ? `
            <div class="plan-location">
              \ud83d\udccd ${esc(location)}
            </div>
          `
          : ''
      }

      ${
        egg
          ? `
            <div class="plan-egg">
              \ud83e\udd5a ${esc(egg)}
            </div>
          `
          : ''
      }

      ${routeSelect}

      ${
        node.cycle
          ? `
            <div class="small">
              \u5faa\u74b0\u3059\u308b\u914d\u5408\u306e\u305f\u3081\u5c55\u958b\u505c\u6b62
            </div>
          `
          : ''
      }
    </div>

    ${
      (
        !checked
        &&
        node.children.length
      )
        ? node.children
            .map(
              child=>
                planNodeHtml(
                  child,
                  depth+1
                )
            )
            .join('')
        : ''
    }
  `;
}

function collectPlanStats(node,stats){
  stats.total++;

  if(
    planState.checked[node.key]
    ||(
      node.monster
      &&shouldStopAtMinRank(node.monster)
    )
  ){
    stats.checked++;
    return;
  }

  if(!node.children.length){
    stats.leaves[node.name]=
      (
        stats.leaves[node.name]
        ||0
      )
      +1;

    return;
  }

  node.children.forEach(
    child=>
      collectPlanStats(
        child,
        stats
      )
  );
}

function remainingHtml(stats){
  const items=
    Object.entries(stats.leaves)
      .sort(
        (a,b)=>
          b[1]-a[1]
          ||
          a[0].localeCompare(
            b[0],
            'ja'
          )
      );

  if(!items.length){
    return `
      <div class="plan-complete">
        \ud83c\udf89 \u5fc5\u8981\u7d20\u6750\u306f\u3059\u3079\u3066\u6e96\u5099\u6e08\u307f\u3067\u3059
      </div>
    `;
  }

  return items.map(
    ([name,count])=>{
      const monster=
        findMonster(name);

      const locations=
        monster?.locations||[];

      const eggs=
        monster?.eggs||[];

      return `
        <div class="material-row">
          <div>
            <strong>
              ${esc(name)}
            </strong>

            <span class="material-count">
              \u00d7${count}
            </span>
          </div>

          ${
            locations.length
              ? `
                <div class="material-location">
                  \ud83d\udccd
                  ${esc(
                    locations
                      .slice(0,2)
                      .map(x=>x.name)
                      .join(' / ')
                  )}
                </div>
              `
              : ''
          }

          ${
            eggs.length
              ? `
                <div class="material-egg">
                  \ud83e\udd5a
                  ${esc(
                    eggs
                      .map(
                        egg=>
                          `${egg.name}\u306e\u5375${
                            egg.postGameOnly
                              ? '\uff08\u30af\u30ea\u30a2\u5f8c\uff09'
                              : ''
                          }`
                      )
                      .join(' / ')
                  )}
                </div>
              `
              : ''
          }
        </div>
      `;
    }
  ).join('');
}

function collectSavedPlanMaterials(){
  const totals={};
  const originalState=planState;

  const aggregateMinRankEnabled=
    Boolean(originalState.minRankEnabled);

  const aggregateMinRank=
    originalState.minRank||'D';

  try{
    for(const saved of savedPlans){
      planState={
        target:saved.target||'',
        checked:clonePlanState(saved.checked||{}),
        routes:clonePlanState(saved.routes||{}),
        minRankEnabled:aggregateMinRankEnabled,
        minRank:aggregateMinRank
      };

      const root=buildPlanNode(planState.target);
      const stats={
        total:0,
        checked:0,
        leaves:{}
      };

      collectPlanStats(root,stats);

      for(const [name,count] of Object.entries(stats.leaves)){
        totals[name]=(totals[name]||0)+count;
      }
    }
  }
  finally{
    planState=originalState;
  }

  return totals;
}

function materialAggregateRows(items){
  if(!items.length){
    return `
      <div class="small">
        該当する素材はありません。
      </div>
    `;
  }

  return items.map(([name,count])=>{
    const monster=findMonster(name);
    const locations=monster?.locations||[];
    const eggs=monster?.eggs||[];

    return `
      <div class="material-row material-total-row">
        <div class="material-total-head">
          <strong>${esc(name)}</strong>
          <span class="material-count">×${count}</span>
        </div>

        ${locations.length ? `
          <div class="material-location">
            📍 ${esc(
              locations
                .slice(0,3)
                .map(x=>x.name)
                .join(' / ')
            )}
          </div>
        ` : ''}

        ${eggs.length ? `
          <div class="material-egg">
            🥚 ${esc(
              eggs
                .map(egg=>
                  `${egg.name}の卵${egg.postGameOnly?'（クリア後）':''}`
                )
                .join(' / ')
            )}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function isSpecialSynthesisOnly(monster){
  const recipes=monster?.recipes||[];
  if(!recipes.length) return false;

  return recipes.every(recipe=>{
    if(recipe.type==='4体配合'){
      return true;
    }

    const parents=recipe.parents||[];
    if(!parents.length) return false;

    return parents.every(parent=>
      Boolean(findMonster(parent))
    );
  });
}

function isOtherAcquisitionMaterial(monster){
  if(!monster) return false;

  if((monster.eggs||[]).length){
    return true;
  }

  return isSpecialSynthesisOnly(monster);
}

function renderSavedMaterialTotals(){
  updatePlanSavedTabLabel();

  if(!savedPlans.length){
    statusEl.textContent='保存ルートがありません';
    results.innerHTML=`
      <div class="empty">
        まず「作成中」で配合ルートを作り、
        保存ルートに登録してください。
      </div>
    `;
    return;
  }

  const totals=collectSavedPlanMaterials();
  const entries=Object.entries(totals)
    .sort(
      (a,b)=>
        b[1]-a[1]
        ||a[0].localeCompare(b[0],'ja')
    );

  const catchable=[];
  const other=[];

  for(const item of entries){
    const monster=findMonster(item[0]);

    if(isOtherAcquisitionMaterial(monster)){
      other.push(item);
    }
    else{
      catchable.push(item);
    }
  }

  const totalCount=entries.reduce(
    (sum,[,count])=>sum+count,
    0
  );

  const catchCount=catchable.reduce(
    (sum,[,count])=>sum+count,
    0
  );

  statusEl.textContent=
    `保存${savedPlans.length}体分 / 必要素材 合計${totalCount}体`;

  results.innerHTML=`
    <section class="card material-total-summary">
      <div class="skillname">
        16体分の素材合計
      </div>

      <div class="material-total-stats">
        <span class="badge">
          保存ルート ${savedPlans.length}/${MAX_SAVED_PLANS}
        </span>
        <span class="badge">
          捕まえる数 ${catchCount}体
        </span>
        <span class="badge">
          素材総数 ${totalCount}体
        </span>
        <span class="badge">
          種類 ${entries.length}種
        </span>
      </div>

      <div class="small">
        各保存ルートの選択中の配合経路を合算しています。
        作成済みチェックが付いた枝は合計から除外します。
        ${planState.minRankEnabled
          ? '現在の最低'+esc(planState.minRank||'D')+'ランク設定を16体すべてに適用しています。'
          : '最低ランク指定はOFFです。'}
      </div>
    </section>

    <section class="card">
      <h2 class="plan-title">
        📍 捕まえるモンスター
      </h2>
      ${materialAggregateRows(catchable)}
    </section>

    ${other.length ? `
      <section class="card">
        <h2 class="plan-title">
          🥚 その他の素材
        </h2>
        <div class="small material-total-note">
          卵で入手するモンスター、または特殊配合でのみ入手できるモンスターです。
        </div>
        ${materialAggregateRows(other)}
      </section>
    ` : ''}
  `;
}

function renderSavedPlans(){
  updatePlanSavedTabLabel();

  statusEl.textContent=
    `保存ルート：${savedPlans.length}/${MAX_SAVED_PLANS}体`;

  if(!savedPlans.length){
    results.innerHTML=`
      <div class="empty">
        保存した配合計画はありません。<br>
        「作成中」で配合ルートを作り、
        「この経路を保存」を押してください。
      </div>
    `;
    return;
  }

  results.innerHTML=`
    <section class="card saved-plan-list">
      <div class="saved-plan-note">
        最大${MAX_SAVED_PLANS}体まで保存できます。
        配合ルートと作成済みチェック状態も一緒に保存します。
      </div>

      ${savedPlans.map((saved,index)=>{
        const monster=findMonster(saved.target);
        const checkedCount=
          Object.values(saved.checked||{})
            .filter(Boolean)
            .length;

        return `
          <div class="saved-plan-row">
            <div class="saved-plan-main">
              <div class="saved-plan-name">
                ${esc(saved.target)}
              </div>

              <div class="saved-plan-meta">
                ${monster?.rank ? esc(monster.rank)+'ランク' : ''}
                ${monster?.family ? ' / '+esc(monster.family) : ''}
                ${checkedCount ? ' / 作成済み '+checkedCount+'件' : ''}
                ${saved.minRankEnabled ? ' / 最低'+esc(saved.minRank||'D')+'ランク' : ''}
              </div>
            </div>

            <div class="saved-plan-actions">
              <button
                class="saved-plan-open"
                type="button"
                onclick="openSavedPlan(${index})"
              >
                開く
              </button>

              <button
                class="saved-plan-delete"
                type="button"
                onclick="deleteSavedPlan(${index})"
              >
                削除
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </section>
  `;
}

function visiblePlanDepth(node,depth=0){
  if(!node.children?.length){
    return depth;
  }

  return Math.max(
    depth,
    ...node.children.map(
      child=>visiblePlanDepth(
        child,
        depth+1
      )
    )
  );
}

function renderPlanKeepingPosition(){
  const tree=
    document.querySelector('.plan-tree');

  const treeScrollLeft=
    tree?.scrollLeft
    ||0;

  const pageScrollY=
    window.scrollY
    ||0;

  renderPlan();

  requestAnimationFrame(()=>{
    const nextTree=
      document.querySelector('.plan-tree');

    if(nextTree){
      nextTree.scrollLeft=
        treeScrollLeft;
    }

    scrollTo({
      top:pageScrollY,
      behavior:'auto'
    });
  });
}

function renderPlan(){
  const target=planState.target;

  if(!target){
    statusEl.textContent=
      '\u4f5c\u308a\u305f\u3044\u30e2\u30f3\u30b9\u30bf\u30fc\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044';

    results.innerHTML=`
      <div class="empty">
        \u4e0a\u306e\u6b04\u304b\u3089\u76ee\u6a19\u30e2\u30f3\u30b9\u30bf\u30fc\u3092\u9078\u3073\u3001
        \u300c\u914d\u5408\u30eb\u30fc\u30c8\u3092\u4f5c\u6210\u300d\u3092\u62bc\u3057\u3066\u304f\u3060\u3055\u3044\u3002
      </div>
    `;

    return;
  }

  const monster=findMonster(target);

  if(!monster){
    statusEl.textContent=
      '\u30e2\u30f3\u30b9\u30bf\u30fc\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093';

    results.innerHTML=`
      <div class="empty">
        \u6b63\u3057\u3044\u30e2\u30f3\u30b9\u30bf\u30fc\u540d\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002
      </div>
    `;

    return;
  }

  const root=
    buildPlanNode(target);

  const treeDepth=
    visiblePlanDepth(root);

  const stats={
    total:0,
    checked:0,
    leaves:{}
  };

  collectPlanStats(root,stats);

  statusEl.textContent=
    `\u76ee\u6a19\uff1a${target}`;

  const progress=
    stats.total
      ? (
          stats.checked
          /
          stats.total
          *
          100
        )
      :0;

  results.innerHTML=`
    <section class="card plan-summary">
      <div class="skillname">
        ${esc(target)}
      </div>

      <div class="progress-text">
        \u4f5c\u6210\u6e08\u307f\uff1a
        ${stats.checked}
        /
        ${stats.total}
      </div>

      ${planState.minRankEnabled ? `
        <div class="plan-rank-summary">
          配合する最低ランク：
          <strong>${esc(planState.minRank)}</strong>
          （このランク以下は自動チェックして素材合計から除外します）
        </div>
      ` : ''}

      <div class="progressbar">
        <div
          class="progressbar-inner"
          style="width:${progress}%"
        ></div>
      </div>

      <div class="plan-summary-actions">
        <button
          class="save-plan-button"
          onclick="saveCurrentPlanToSlot()"
        >
          💾 この経路を保存
        </button>

        <button
          class="clearbutton"
          onclick="clearPlanChecks()"
        >
          \u30c1\u30a7\u30c3\u30af\u3092\u3059\u3079\u3066\u89e3\u9664
        </button>
      </div>
    </section>

    <section class="card">
      <h2 class="plan-title">
        \u914d\u5408\u7cfb\u7d71\u56f3
      </h2>

      <div
        class="plan-tree"
        aria-label="配合系統図。深い階層は横にスクロールできます"
      >
        <div
          class="plan-tree-canvas"
          style="--tree-depth:${treeDepth}"
        >
          ${planNodeHtml(root)}
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="plan-title">
        \u6b8b\u308a\u5fc5\u8981\u7d20\u6750
      </h2>

      ${remainingHtml(stats)}
    </section>
  `;
}

window.togglePlanCheck=
  function(key,name,checked){
    planState.checked[key]=checked;

    if(checked){
      setMonsterAcquired(name,true);
    }

    savePlanState();
    renderPlanKeepingPosition();
  };

window.changePlanRoute=
  function(key,value){
    planState.routes[key]=
      Number(value);

    savePlanState();
    renderPlanKeepingPosition();
  };

window.clearPlanChecks=
  function(){
    planState.checked={};
    savePlanState();
    renderPlan();
  };

function createPlan(){
  const name=
    planTarget.value.trim();

  if(!findMonster(name)){
    statusEl.textContent=
      '\u30e2\u30f3\u30b9\u30bf\u30fc\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093';

    return;
  }

  planState.target=name;
  planView='current';
  savePlanState();
  updatePlanSubtabs();
  renderPlan();
}

function updatePlanSubtabs(){
  if(!planCurrentTab || !planSavedTab) return;

  planCurrentTab.classList.toggle(
    'active',
    planView==='current'
  );

  planSavedTab.classList.toggle(
    'active',
    planView==='saved'
  );

  planMaterialsTab.classList.toggle(
    'active',
    planView==='materials'
  );

  updatePlanSavedTabLabel();
}

