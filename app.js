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

const sortSelect=
  document.getElementById('sortSelect');

const sortRow=
  document.getElementById('sortRow');


/* =========================
   共通
========================= */

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


/* =========================
   モンスター
========================= */

function imgUrl(name){

  return (
    'https://www.google.com/search?tbm=isch&q='
    +
    encodeURIComponent(
      'DQM3 '+name
    )
  );
}


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


/* =========================
   モンスター配合表示
========================= */

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


/* =========================
   モンスターカード
========================= */

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
            ? `
              <span class="badge">
                No.${esc(m.no)}
              </span>
            `
            : ''
        }


        ${
          m.rank
            ? `
              <span class="badge">
                ${esc(m.rank)}ランク
              </span>
            `
            : ''
        }


        ${
          m.family
            ? `
              <span class="badge">
                ${esc(m.family)}
              </span>
            `
            : ''
        }

      </div>


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


/* =========================
   検索優先度
========================= */

function searchScore(name,term){

  if(!term){
    return 0;
  }

  const value=
    norm(name);


  if(value===term){
    return 0;
  }

  if(value.startsWith(term)){
    return 1;
  }

  if(value.includes(term)){
    return 2;
  }

  return 3;
}


/* =========================
   モンスター並び替え
========================= */

function compareMonsters(a,b,term){

  /*
   * 検索中は
   * 完全一致を最優先
   */
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


  /*
   * 名前順
   */
  if(
    sortSelect.value==='name'
  ){

    const aName=
      a.reading
      ||
      a.name
      ||
      '';

    const bName=
      b.reading
      ||
      b.name
      ||
      '';


    const compare=
      String(aName)
        .localeCompare(
          String(bName),
          'ja'
        );


    if(compare!==0){
      return compare;
    }


    return (
      (a.no??9999)
      -
      (b.no??9999)
    );
  }


  /*
   * ランク順
   *
   * X → S → A → B → C
   * → D → E → F → G
   */
  if(
    sortSelect.value==='rank'
  ){

    const rankOrder={
      'X':0,
      'S':1,
      'A':2,
      'B':3,
      'C':4,
      'D':5,
      'E':6,
      'F':7,
      'G':8
    };


    const ar=
      rankOrder[
        String(a.rank||'')
          .toUpperCase()
      ]
      ?? 99;


    const br=
      rankOrder[
        String(b.rank||'')
          .toUpperCase()
      ]
      ?? 99;


    if(ar!==br){
      return ar-br;
    }


    /*
     * 同ランクなら図鑑番号順
     */
    return (
      (a.no??9999)
      -
      (b.no??9999)
    );
  }


  /*
   * 種族順
   */
  if(
    sortSelect.value==='family'
  ){

    const familyCompare=
      String(a.family||'')
        .localeCompare(
          String(b.family||''),
          'ja'
        );


    if(familyCompare!==0){
      return familyCompare;
    }


    /*
     * 同じ種族なら
     * 図鑑番号順
     */
    return (
      (a.no??9999)
      -
      (b.no??9999)
    );
  }


  /*
   * デフォルト：
   * 図鑑番号順
   */
  return (
    (a.no??9999)
    -
    (b.no??9999)
  );
}


/* =========================
   モンスター検索
========================= */

function renderMonsters(){

  const term=
    norm(q.value);


  const found=
    DB.monsters.filter(m=>{

      const text=[

        m.name,
        m.reading,
        m.rank,
        m.family,
        m.no,

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


/* =========================
   スキル一覧
========================= */

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

          recipe.forEach(name=>{

            names.add(name);

          });

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
    skill=>
      skill.name===name
  );
}


/* =========================
   スキル作成方法
========================= */

function skillRecipesFor(name){

  const recipes=[];


  SKILL_DB.skills
    .forEach(skill=>{


      if(skill.name===name){

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

            type:
              '進化',

            parents:
              (evo.required||[])
                .map(req=>(
                  `${req.skill} ${req.points}P`
                )),

            result:
              evo.result,

            note:
              evo.note||''

          });

        });

    });


  const unique=[];
  const seen=new Set();


  recipes.forEach(recipe=>{

    const key=
      JSON.stringify(
        recipe
      );


    if(
      !seen.has(key)
    ){

      seen.add(key);

      unique.push(
        recipe
      );
    }

  });


  return unique;
}


/* =========================
   このスキルから作れるもの
========================= */

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
                  req=>(
                    `${req.skill} ${req.points}P`
                  )
                ),

              result:
                evo.result,

              note:
                evo.note||''

            });

          }

        });

    });


  const unique=[];
  const seen=new Set();


  uses.forEach(use=>{

    const key=
      JSON.stringify(use);


    if(
      !seen.has(key)
    ){

      seen.add(key);

      unique.push(use);
    }

  });


  return unique;
}


/* =========================
   スキル経路
========================= */

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
          match && match[2]
            ? ` ${match[2]}P`
            : '';


        return (
          skillButton(skillName)
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


/* =========================
   覚える特技・効果
========================= */

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


  const rows=
    abilities
      .slice()
      .sort(
        (a,b)=>
          Number(a.points||0)
          -
          Number(b.points||0)
      )
      .map(ability=>`

        <div class="skillability">

          <span class="skillpoints">
            ${esc(ability.points)}P
          </span>

          <span class="abilityname">
            ${esc(ability.name)}
          </span>

          ${
            ability.note
              ? `
                <span class="abilitynote">
                  ${esc(ability.note)}
                </span>
              `
              : ''
          }

        </div>

      `)
      .join('');


  return `
    <div class="skilltable">
      ${rows}
    </div>
  `;
}


/* =========================
   スキルカード
========================= */

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


        ${
          skill?.category
            ? `
              <span class="badge">
                ${esc(skill.category)}
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
              進化・配合での作成条件なし／未登録
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


/* =========================
   スキル検索
========================= */

function renderSkills(){

  const term=
    norm(q.value);


  let found=
    allSkillNames()
      .filter(name=>{

        const skill=
          findSkill(name);


        const abilityText=
          (skill?.abilities||[])
            .map(a=>a.name)
            .join(' ');


        const text=
          `${name} ${abilityText}`;


        return (
          !term
          ||
          norm(text)
            .includes(term)
        );

      });


  found.sort(
    (a,b)=>{

      if(!term){

        return a.localeCompare(
          b,
          'ja'
        );
      }


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


/* =========================
   タブ
========================= */

function updateTabs(){

  monsterTab.classList.toggle(
    'active',
    mode==='monster'
  );


  skillTab.classList.toggle(
    'active',
    mode==='skill'
  );


  q.placeholder=
    mode==='monster'
      ? 'モンスター名を入力'
      : 'スキル名・特技名を入力';


  /*
   * 並び替えは
   * モンスター画面だけ表示
   */
  sortRow.style.display=
    mode==='monster'
      ? 'flex'
      : 'none';
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


/* =========================
   表示イベント
========================= */

function render(){

  if(
    mode==='skill'
  ){

    renderSkills();

  }
  else{

    renderMonsters();

  }
}


q.addEventListener(
  'input',
  render
);


sortSelect.addEventListener(
  'change',
  render
);


/* =========================
   オンライン状態
========================= */

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


/* =========================
   データ読み込み
========================= */

Promise.all([

  fetch(
    './data.json?v=8',
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
    './skills.json?v=8',
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

    updateTabs();

    render();

  }
)
.catch(err=>{

  console.error(err);

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


/* =========================
   Service Worker
========================= */

if(
  'serviceWorker'
  in navigator
){

  navigator
    .serviceWorker
    .register(
      './sw.js?v=8'
    )
    .catch(()=>{});

}
