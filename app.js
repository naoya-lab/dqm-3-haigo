let DB={
  monsters:[]
};

let SKILL_DB={
  skills:[]
};

let mode='monster';


const q=
  document.getElementById('q');

const results=
  document.getElementById('results');

const statusEl=
  document.getElementById('status');

const net=
  document.getElementById('net');

const monsterTab=
  document.getElementById('monsterTab');

const skillTab=
  document.getElementById('skillTab');

const planTab=
  document.getElementById('planTab');

const sortSelect=
  document.getElementById('sortSelect');

const sortRow=
  document.getElementById('sortRow');

const normalSearch=
  document.getElementById('normalSearch');

const planControls=
  document.getElementById('planControls');

const planTarget=
  document.getElementById('planTarget');

const buildPlanButton=
  document.getElementById('buildPlan');

const monsterOptions=
  document.getElementById('monsterOptions');


/* =====================================
   共通
===================================== */

function esc(s){

  return String(s??'')
    .replace(
      /[&<>"']/g,
      c=>({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'
      }[c])
    );
}


function norm(s){

  return String(s??'')
    .toLowerCase()
    .replace(
      /[\s・･ー]/g,
      ''
    );
}


function findMonster(name){

  return DB.monsters.find(
    m=>m.name===name
  );
}


function imgUrl(name){

  return (
    'https://www.google.com/search?tbm=isch&q='
    +
    encodeURIComponent(
      'DQM3 '+name
    )
  );
}


/* =====================================
   モンスター移動
===================================== */

function jumpMonster(name){

  mode='monster';

  updateTabs();

  q.value=name;

  render();

  scrollTo({
    top:0,
    behavior:'smooth'
  });
}


function jumpSkill(name){

  mode='skill';

  updateTabs();

  q.value=name;

  render();

  scrollTo({
    top:0,
    behavior:'smooth'
  });
}


window.jumpMonster=
  jumpMonster;

window.jumpSkill=
  jumpSkill;


function monsterButton(name){

  return `
    <button
      class="jump"
      onclick='jumpMonster(${JSON.stringify(name)})'
    >
      ${esc(name)}
    </button>
  `;
}


function skillButton(name){

  return `
    <button
      class="jump skilljump"
      onclick='jumpSkill(${JSON.stringify(name)})'
    >
      ${esc(name)}
    </button>
  `;
}


/* =====================================
   生息地
===================================== */

function locationText(location){

  const seasons=
    (location.seasons||[])
      .join('・');


  return `
    <div class="location-row">

      <div class="location-name">
        📍 ${esc(location.name)}
      </div>

      <div class="location-detail">

        ${
          seasons
            ? `季節：${esc(seasons)}`
            : ''
        }

        ${
          location.weather
            ? `　天候：${esc(location.weather)}`
            : ''
        }

        ${
          location.miniBoss
            ? '　ミニボス'
            : ''
        }

      </div>

    </div>
  `;
}


function locationsHtml(monster){

  const locations=
    monster.locations||[];


  if(!locations.length){

    return `
      <div class="small">
        野生出現なし／未登録
      </div>
    `;
  }


  return `
    <div class="locations">
      ${
        locations
          .map(locationText)
          .join('')
      }
    </div>
  `;
}


/* =====================================
   モンスター配合
===================================== */

function recipeText(r){

  const parents=
    (r.parents||[])
      .map(monsterButton)
      .join(' ＋ ');


  return `
    <div class="route">

      <span class="rtype">
        ${esc(r.type||'配合')}
      </span>

      ${parents}

      <span class="arrow">
        →
      </span>

      ${esc(r.result||'')}

    </div>
  `;
}


function useText(u){

  const other=
    (u.otherParents||[])
      .map(monsterButton)
      .join(' ＋ ');


  return `
    <div class="route">

      <span class="rtype">
        ${esc(u.type||'配合')}
      </span>

      ${esc(u.source||'')}

      ${
        other
          ? `＋ ${other}`
          : ''
      }

      <span class="arrow">
        →
      </span>

      ${monsterButton(u.result)}

    </div>
  `;
}


/* =====================================
   モンスターカード
===================================== */

function monsterCard(m){

  const recipes=
    (m.recipes||[])
      .map(recipeText)
      .join('')
    ||
    `
      <div class="small">
        配合での入手なし／未登録
      </div>
    `;


  const uses=
    (m.uses||[])
      .map(useText)
      .join('')
    ||
    `
      <div class="small">
        特殊な配合先なし／未登録
      </div>
    `;


  return `
    <section class="card">

      <div class="name">

        <a
          target="_blank"
          rel="noopener"
          href="${imgUrl(m.name)}"
        >
          ${esc(m.name)}
        </a>

      </div>


      <div class="meta">

        ${
          m.no
            ? `<span class="badge">No.${esc(m.no)}</span>`
            : ''
        }

        ${
          m.rank
            ? `<span class="badge">${esc(m.rank)}ランク</span>`
            : ''
        }

        ${
          m.family
            ? `<span class="badge">${esc(m.family)}</span>`
            : ''
        }

      </div>


      <h2>
        生息地
      </h2>

      ${locationsHtml(m)}


      <h2>
        このモンスターの作り方
      </h2>

      ${recipes}


      <h2>
        このモンスターを使う配合先
      </h2>

      ${uses}

    </section>
  `;
}


/* =====================================
   検索・並び替え
===================================== */

function searchScore(
  name,
  term
){

  if(!term){
    return 0;
  }

  const value=
    norm(name);

  if(value===term){
    return 0;
  }

  if(
    value.startsWith(term)
  ){
    return 1;
  }

  if(
    value.includes(term)
  ){
    return 2;
  }

  return 3;
}


function compareMonsters(
  a,
  b,
  term
){

  if(term){

    const as=
      searchScore(
        a.name,
        term
      );

    const bs=
      searchScore(
        b.name,
        term
      );

    if(as!==bs){
      return as-bs;
    }
  }


  if(
    sortSelect.value==='name'
  ){

    const aa=
      a.reading
      || a.name
      || '';

    const bb=
      b.reading
      || b.name
      || '';

    const c=
      aa.localeCompare(
        bb,
        'ja'
      );

    if(c!==0){
      return c;
    }
  }


  if(
    sortSelect.value==='rank'
  ){

    const rankOrder={
      X:0,
      S:1,
      A:2,
      B:3,
      C:4,
      D:5,
      E:6,
      F:7,
      G:8
    };

    const ar=
      rankOrder[
        String(
          a.rank||''
        ).toUpperCase()
      ] ?? 99;

    const br=
      rankOrder[
        String(
          b.rank||''
        ).toUpperCase()
      ] ?? 99;

    if(ar!==br){
      return ar-br;
    }
  }


  if(
    sortSelect.value==='family'
  ){

    const c=
      String(
        a.family||''
      ).localeCompare(
        String(
          b.family||''
        ),
        'ja'
      );

    if(c!==0){
      return c;
    }
  }


  return (
    (a.no??9999)
    -
    (b.no??9999)
  );
}


function renderMonsters(){

  const term=
    norm(q.value);


  const found=
    DB.monsters.filter(m=>{

      const locations=
        (m.locations||[])
          .flatMap(x=>[
            x.name,
            ...(x.seasons||[]),
            x.weather
          ]);


      const text=[

        m.name,
        m.reading,
        m.rank,
        m.family,
        m.no,

        ...locations,

        ...(m.recipes||[])
          .flatMap(r=>[
            ...(r.parents||[]),
            r.result
          ]),

        ...(m.uses||[])
          .flatMap(u=>[
            ...(u.otherParents||[]),
            u.result
          ])

      ].join(' ');


      return (
        !term
        ||
        norm(text)
          .includes(term)
      );

    });


  found.sort(
    (a,b)=>
      compareMonsters(
        a,
        b,
        term
      )
  );


  statusEl.textContent=
    term
      ? `検索結果：${found.length}体`
      : `登録：${DB.monsters.length}体`;


  results.innerHTML=
    found.length
      ? found
          .map(monsterCard)
          .join('')
      : `
          <div class="empty">
            該当するモンスターがありません。
          </div>
        `;
}


/* =====================================
   スキル
===================================== */

function allSkillNames(){

  const names=
    new Set();


  SKILL_DB.skills
    .forEach(skill=>{

      if(skill.name){
        names.add(
          skill.name
        );
      }


      (skill.recipes||[])
        .forEach(recipe=>{

          recipe.forEach(
            name=>
              names.add(name)
          );

        });


      (skill.evolvesTo||[])
        .forEach(evo=>{

          if(evo.result){
            names.add(
              evo.result
            );
          }

          (evo.required||[])
            .forEach(req=>{

              if(req.skill){
                names.add(
                  req.skill
                );
              }

            });

        });

    });


  return [...names];
}


function findSkill(name){

  return SKILL_DB.skills.find(
    x=>x.name===name
  );
}


function skillRecipesFor(name){

  const recipes=[];


  SKILL_DB.skills
    .forEach(skill=>{

      if(
        skill.name===name
      ){

        (skill.recipes||[])
          .forEach(recipe=>{

            recipes.push({
              type:
                '組み合わせ',

              parents:
                recipe,

              result:
                skill.name,

              note:
                skill.note||''
            });

          });

      }


      (skill.evolvesTo||[])
        .forEach(evo=>{

          if(
            evo.result!==name
          ){
            return;
          }

          recipes.push({

            type:'進化',

            parents:
              (evo.required||[])
                .map(req=>
                  `${req.skill} ${req.points}P`
                ),

            result:
              evo.result,

            note:
              evo.note||''
          });

        });

    });


  return uniqueObjects(
    recipes
  );
}


function skillUsesFor(name){

  const uses=[];


  SKILL_DB.skills
    .forEach(skill=>{

      (skill.recipes||[])
        .forEach(recipe=>{

          if(
            recipe.includes(name)
          ){

            uses.push({
              type:
                '組み合わせ',

              parents:
                recipe,

              result:
                skill.name,

              note:
                skill.note||''
            });

          }

        });


      (skill.evolvesTo||[])
        .forEach(evo=>{

          const required=
            evo.required||[];

          if(
            required.some(
              req=>
                req.skill===name
            )
          ){

            uses.push({

              type:
                '進化',

              parents:
                required.map(
                  req=>
                    `${req.skill} ${req.points}P`
                ),

              result:
                evo.result,

              note:
                evo.note||''
            });

          }

        });

    });


  return uniqueObjects(
    uses
  );
}


function uniqueObjects(items){

  const seen=
    new Set();

  return items.filter(
    item=>{

      const key=
        JSON.stringify(item);

      if(
        seen.has(key)
      ){
        return false;
      }

      seen.add(key);

      return true;
    }
  );
}


function skillRoute(route){

  const parents=
    (route.parents||[])
      .map(value=>{

        const match=
          String(value)
            .match(
              /^(.*?)(?:\s+(\d+)P)?$/
            );

        const skillName=
          match
            ? match[1]
            : value;

        const points=
          (
            match
            && match[2]
          )
            ? ` ${match[2]}P`
            : '';

        return (
          skillButton(
            skillName
          )
          +
          `<strong>${esc(points)}</strong>`
        );

      })
      .join(' ＋ ');


  return `
    <div class="route skillroute">

      <span class="rtype">
        ${esc(route.type||'進化')}
      </span>

      ${parents}

      <span class="arrow">
        →
      </span>

      ${skillButton(route.result)}

      ${
        route.note
          ? `
              <div class="skillnote">
                ${esc(route.note)}
              </div>
            `
          : ''
      }

    </div>
  `;
}


function abilityTable(skill){

  const abilities=
    skill?.abilities||[];


  if(
    !abilities.length
  ){

    return `
      <div class="small">
        特技・効果データ未登録
      </div>
    `;
  }


  return `
    <div class="skilltable">

      ${
        abilities
          .slice()
          .sort(
            (a,b)=>
              Number(a.points||0)
              -
              Number(b.points||0)
          )
          .map(
            ability=>`
              <div class="skillability">

                <span class="skillpoints">
                  ${esc(ability.points)}P
                </span>

                <span class="abilityname">
                  ${esc(ability.name)}
                </span>

              </div>
            `
          )
          .join('')
      }

    </div>
  `;
}


function skillCard(name){

  const skill=
    findSkill(name);

  const recipes=
    skillRecipesFor(name);

  const uses=
    skillUsesFor(name);


  return `
    <section class="card">

      <div class="skillname">
        ${esc(name)}
      </div>

      <div class="meta">

        ${
          skill?.maxPoints
            ? `
                <span class="badge">
                  最大 ${esc(skill.maxPoints)}P
                </span>
              `
            : ''
        }

      </div>


      <h2>
        覚える特技・効果
      </h2>

      ${abilityTable(skill)}


      <h2>
        このスキルの作り方
      </h2>

      ${
        recipes.length
          ? recipes
              .map(skillRoute)
              .join('')
          : `
              <div class="small">
                作成条件なし／未登録
              </div>
            `
      }


      <h2>
        このスキルから作れるもの
      </h2>

      ${
        uses.length
          ? uses
              .map(skillRoute)
              .join('')
          : `
              <div class="small">
                上位スキルなし／未登録
              </div>
            `
      }

    </section>
  `;
}


function renderSkills(){

  const term=
    norm(q.value);


  const found=
    allSkillNames()
      .filter(name=>{

        const skill=
          findSkill(name);

        const abilityText=
          (skill?.abilities||[])
            .map(x=>x.name)
            .join(' ');

        return (
          !term
          ||
          norm(
            `${name} ${abilityText}`
          ).includes(term)
        );

      })
      .sort(
        (a,b)=>{

          const as=
            searchScore(
              a,
              term
            );

          const bs=
            searchScore(
              b,
              term
            );

          if(as!==bs){
            return as-bs;
          }

          return a.localeCompare(
            b,
            'ja'
          );
        }
      );


  statusEl.textContent=
    term
      ? `検索結果：${found.length}件`
      : `スキル：${found.length}件`;


  results.innerHTML=
    found.length
      ? found
          .map(skillCard)
          .join('')
      : `
          <div class="empty">
            該当するスキルがありません。
          </div>
        `;
}


/* =====================================
   配合計画
===================================== */

const PLAN_KEY=
  'dqm3-plan-v1';


let planState={
  target:'',
  checked:{},
  routes:{}
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
    JSON.stringify(
      planState
    )
  );
}


function nodeKey(
  target,
  path
){

  return (
    target
    +'::'
    +path
  );
}


function buildPlanNode(
  name,
  path='0',
  stack=[]
){

  const monster=
    findMonster(name);


  const key=
    nodeKey(
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


  if(
    stack.includes(name)
  ){

    return {
      name,
      key,
      monster,
      cycle:true,
      children:[]
    };
  }


  const recipes=
    monster.recipes||[];


  if(
    !recipes.length
  ){

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
      ?? 0
    );


  if(
    routeIndex
    >= recipes.length
  ){

    routeIndex=0;

  }


  const recipe=
    recipes[
      routeIndex
    ];


  const children=
    (recipe.parents||[])
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


function planNodeHtml(
  node,
  depth=0
){

  const checked=
    Boolean(
      planState.checked[
        node.key
      ]
    );


  const indent=
    Math.min(
      depth,
      8
    );


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
                          .join(' ＋ ')
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
    node.monster
      ? shortLocation(
          node.monster
        )
      : '';


  return `
    <div
      class="plan-node"
      style="--depth:${indent}"
    >

      <div class="plan-node-head">

        <input
          type="checkbox"
          class="plan-check"
          ${
            checked
              ? 'checked'
              : ''
          }
          onchange='togglePlanCheck(
            ${JSON.stringify(node.key)},
            this.checked
          )'
        >

        <button
          class="plan-name"
          onclick='jumpMonster(
            ${JSON.stringify(node.name)}
          )'
          ${
            !node.monster
              ? 'disabled'
              : ''
          }
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

      </div>


      ${
        location
          ? `
              <div class="plan-location">
                📍 ${esc(location)}
              </div>
            `
          : ''
      }


      ${routeSelect}


      ${
        node.cycle
          ? `
              <div class="small">
                循環する配合のため展開停止
              </div>
            `
          : ''
      }

    </div>


    ${
      (
        !checked
        && node.children.length
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


function shortLocation(monster){

  const locations=
    monster.locations||[];

  if(!locations.length){
    return '';
  }

  return locations[
    0
  ].name;
}


function collectPlanStats(
  node,
  stats
){

  stats.total++;


  if(
    planState.checked[
      node.key
    ]
  ){

    stats.checked++;

    return;
  }


  if(
    !node.children.length
  ){

    stats.leaves[
      node.name
    ] =
      (
        stats.leaves[
          node.name
        ]
        || 0
      )
      + 1;

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


function remainingHtml(
  stats
){

  const items=
    Object.entries(
      stats.leaves
    )
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
        🎉 必要素材はすべて準備済みです
      </div>
    `;
  }


  return items.map(
    ([name,count])=>{

      const monster=
        findMonster(name);

      const locations=
        monster?.locations||[];


      return `
        <div class="material-row">

          <div>

            <strong>
              ${esc(name)}
            </strong>

            <span class="material-count">
              ×${count}
            </span>

          </div>

          ${
            locations.length
              ? `
                  <div class="material-location">
                    📍
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

        </div>
      `;

    }
  ).join('');
}


function renderPlan(){

  const target=
    planState.target;


  if(!target){

    statusEl.textContent=
      '作りたいモンスターを入力してください';


    results.innerHTML=
      `
        <div class="empty">
          上の欄から目標モンスターを選び、
          「配合ルートを作成」を押してください。
        </div>
      `;

    return;
  }


  const monster=
    findMonster(target);


  if(!monster){

    statusEl.textContent=
      'モンスターが見つかりません';


    results.innerHTML=
      `
        <div class="empty">
          正しいモンスター名を選択してください。
        </div>
      `;

    return;
  }


  const root=
    buildPlanNode(
      target
    );


  const stats={
    total:0,
    checked:0,
    leaves:{}
  };


  collectPlanStats(
    root,
    stats
  );


  statusEl.textContent=
    `目標：${target}`;


  results.innerHTML=
    `

      <section class="card plan-summary">

        <div class="skillname">
          ${esc(target)}
        </div>

        <div class="progress-text">
          作成済み：
          ${stats.checked}
          /
          ${stats.total}
        </div>


        <div class="progressbar">

          <div
            class="progressbar-inner"
            style="width:${
              stats.total
                ? (
                    stats.checked
                    /stats.total
                    *100
                  )
                : 0
            }%"
          ></div>

        </div>


        <button
          class="clearbutton"
          onclick="clearPlanChecks()"
        >
          チェックをすべて解除
        </button>

      </section>


      <section class="card">

        <h2 class="plan-title">
          配合系統図
        </h2>

        <div class="plan-tree">
          ${planNodeHtml(root)}
        </div>

      </section>


      <section class="card">

        <h2 class="plan-title">
          残り必要素材
        </h2>

        ${remainingHtml(stats)}

      </section>
    `;
}


window.togglePlanCheck=
  function(
    key,
    checked
  ){

    planState.checked[
      key
    ] =
      checked;

    savePlanState();

    renderPlan();
  };


window.changePlanRoute=
  function(
    key,
    value
  ){

    planState.routes[
      key
    ] =
      Number(value);

    savePlanState();

    renderPlan();
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
      'モンスターが見つかりません';

    return;
  }


  planState.target=
    name;

  savePlanState();

  renderPlan();
}


/* =====================================
   タブ
===================================== */

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


  const isPlan=
    mode==='plan';


  normalSearch.hidden=
    isPlan;

  planControls.hidden=
    !isPlan;


  if(
    mode==='monster'
  ){

    q.placeholder=
      'モンスター名・生息地を入力';

    sortRow.style.display=
      'flex';
  }


  if(
    mode==='skill'
  ){

    q.placeholder=
      'スキル名・特技名を入力';

    sortRow.style.display=
      'none';
  }


  if(isPlan){

    planTarget.value=
      planState.target
      || '';

  }
}


monsterTab.addEventListener(
  'click',
  ()=>{

    mode='monster';

    q.value='';

    updateTabs();

    render();
  }
);


skillTab.addEventListener(
  'click',
  ()=>{

    mode='skill';

    q.value='';

    updateTabs();

    render();
  }
);


planTab.addEventListener(
  'click',
  ()=>{

    mode='plan';

    updateTabs();

    render();
  }
);


buildPlanButton.addEventListener(
  'click',
  createPlan
);


planTarget.addEventListener(
  'keydown',
  event=>{

    if(
      event.key==='Enter'
    ){

      createPlan();

    }

  }
);


/* =====================================
   描画
===================================== */

function render(){

  if(
    mode==='monster'
  ){

    renderMonsters();

    return;
  }


  if(
    mode==='skill'
  ){

    renderSkills();

    return;
  }


  renderPlan();
}


q.addEventListener(
  'input',
  render
);


sortSelect.addEventListener(
  'change',
  render
);


/* =====================================
   ネット状態
===================================== */

function updateNet(){

  net.textContent=
    navigator.onLine
      ? 'オンライン'
      : 'オフライン';
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


/* =====================================
   データ読み込み
===================================== */

loadPlanState();


Promise.all([

  fetch(
    './data.json?v=9',
    {
      cache:'no-store'
    }
  )
  .then(r=>{

    if(!r.ok){
      throw new Error(
        'data.json'
      );
    }

    return r.json();
  }),


  fetch(
    './skills.json?v=9',
    {
      cache:'no-store'
    }
  )
  .then(r=>{

    if(!r.ok){
      throw new Error(
        'skills.json'
      );
    }

    return r.json();
  })

])
.then(
  ([
    monsterData,
    skillData
  ])=>{

    DB=
      monsterData;

    SKILL_DB=
      skillData;


    monsterOptions.innerHTML=
      DB.monsters
        .map(
          m=>`
            <option
              value="${esc(m.name)}"
            ></option>
          `
        )
        .join('');


    updateTabs();

    render();

  }
)
.catch(error=>{

  console.error(
    error
  );

  statusEl.textContent=
    'データ読み込みエラー';

  results.innerHTML=
    `
      <div class="empty">
        data.json または
        skills.json を確認してください。
      </div>
    `;
});


/* =====================================
   Service Worker
===================================== */

if(
  'serviceWorker'
  in navigator
){

  navigator
    .serviceWorker
    .register(
      './sw.js?v=9'
    )
    .catch(()=>{});

}
