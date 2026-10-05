let DB={monsters:[]};
let SKILL_DB={skills:[]};

let mode='monster';

const q=document.getElementById('q');
const results=document.getElementById('results');
const statusEl=document.getElementById('status');
const net=document.getElementById('net');

const monsterTab=document.getElementById('monsterTab');
const skillTab=document.getElementById('skillTab');


function esc(s){
  return String(s??'').replace(
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
    .replace(/[\s・･ー]/g,'');
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


window.jumpMonster=jumpMonster;
window.jumpSkill=jumpSkill;


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
   モンスター表示
========================= */

function recipeText(r){

  const parents=(r.parents||[])
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

  const other=(u.otherParents||[])
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


function monsterCard(m){

  const recipes=(m.recipes||[])
    .map(recipeText)
    .join('')
    ||
    '<div class="small">配合での入手なし／未登録</div>';

  const uses=(m.uses||[])
    .map(useText)
    .join('')
    ||
    '<div class="small">特殊な配合先なし／未登録</div>';

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


function renderMonsters(){

  const term=norm(q.value);

  const found=DB.monsters.filter(m=>{

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
      norm(text).includes(term)
    );
  });


  found.sort((a,b)=>{

    if(!term){
      return (
        (a.no??9999)
        -
        (b.no??9999)
      );
    }

    const an=norm(a.name);
    const bn=norm(b.name);

    const score=name=>{

      if(name===term){
        return 0;
      }

      if(name.startsWith(term)){
        return 1;
      }

      if(name.includes(term)){
        return 2;
      }

      return 3;
    };

    const as=score(an);
    const bs=score(bn);

    if(as!==bs){
      return as-bs;
    }

    return (
      (a.no??9999)
      -
      (b.no??9999)
    );
  });


  statusEl.textContent=
    term
      ? `検索結果：${found.length}体`
      : `登録：${DB.monsters.length}体`;


  results.innerHTML=
    found.length
      ? found.map(monsterCard).join('')
      : '<div class="empty">該当するモンスターがありません。</div>';
}


/* =========================
   スキル表示
========================= */


function allSkillNames(){

  const names=new Set();

  SKILL_DB.skills.forEach(skill=>{

    names.add(skill.name);


    (skill.recipes||[])
      .forEach(recipe=>{

        recipe.forEach(name=>{
          names.add(name);
        });

      });


    (skill.evolvesTo||[])
      .forEach(evo=>{

        names.add(evo.result);

        (evo.required||[])
          .forEach(req=>{
            names.add(req.skill);
          });

      });

  });

  return [...names];
}


function findSkill(name){

  return SKILL_DB.skills.find(
    s=>s.name===name
  );
}


function skillRecipesFor(name){

  const recipes=[];

  SKILL_DB.skills.forEach(skill=>{

    if(skill.name===name){

      (skill.recipes||[])
        .forEach(recipe=>{

          recipes.push({
            type:'組み合わせ',
            parents:recipe,
            result:skill.name,
            note:skill.note||''
          });

        });


      (skill.evolvesTo||[])
        .forEach(evo=>{

          if(evo.result===name){

            recipes.push({
              type:'進化',
              parents:(evo.required||[])
                .map(x=>(
                  `${x.skill} ${x.points}P`
                )),
              result:evo.result,
              note:evo.note||''
            });

          }

        });

    }


    (skill.evolvesTo||[])
      .forEach(evo=>{

        if(evo.result!==name){
          return;
        }

        recipes.push({
          type:'進化',
          parents:(evo.required||[])
            .map(x=>(
              `${x.skill} ${x.points}P`
            )),
          result:evo.result,
          note:evo.note||''
        });

      });

  });


  const unique=[];

  const seen=new Set();

  recipes.forEach(r=>{

    const key=JSON.stringify(r);

    if(!seen.has(key)){

      seen.add(key);

      unique.push(r);
    }

  });

  return unique;
}


function skillUsesFor(name){

  const uses=[];


  SKILL_DB.skills.forEach(skill=>{

    (skill.recipes||[])
      .forEach(recipe=>{

        if(recipe.includes(name)){

          uses.push({
            type:'組み合わせ',
            parents:recipe,
            result:skill.name,
            note:skill.note||''
          });

        }

      });


    (skill.evolvesTo||[])
      .forEach(evo=>{

        const required=
          evo.required||[];

        if(
          required.some(
            req=>req.skill===name
          )
        ){

          uses.push({
            type:'進化',
            parents:required.map(
              req=>(
                `${req.skill} ${req.points}P`
              )
            ),
            result:evo.result,
            note:evo.note||''
          });

        }

      });

  });

  return uses;
}


function skillRoute(route){

  const parents=route.parents
    .map(value=>{

      /*
       * 「火の心 100P」なら
       * ボタン名は火の心だけにする
       */
      const match=
        String(value).match(
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
        esc(points)
      );

    })
    .join(' ＋ ');


  return `
    <div class="route skillroute">

      <span class="rtype">
        ${esc(route.type)}
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


function skillCard(name){

  const skill=findSkill(name);

  const recipes=
    skillRecipesFor(name);

  const uses=
    skillUsesFor(name);


  return `
    <section class="card">

      <div class="skillname">
        ${esc(name)}
      </div>

      ${
        skill?.maxPoints
          ? `
            <div class="meta">
              <span class="badge">
                最大 ${skill.maxPoints}P
              </span>
            </div>
          `
          : ''
      }

      <h2>
        このスキルの作り方
      </h2>

      ${
        recipes.length
          ? recipes.map(skillRoute).join('')
          : '<div class="small">進化・配合での作成条件なし／未登録</div>'
      }

      <h2>
        このスキルから作れるもの
      </h2>

      ${
        uses.length
          ? uses.map(skillRoute).join('')
          : '<div class="small">上位スキルなし／未登録</div>'
      }

    </section>
  `;
}


function renderSkills(){

  const term=norm(q.value);

  let found=allSkillNames()
    .filter(name=>(
      !term
      ||
      norm(name).includes(term)
    ));


  found.sort((a,b)=>{

    if(!term){
      return a.localeCompare(
        b,
        'ja'
      );
    }

    const an=norm(a);
    const bn=norm(b);

    const score=name=>{

      if(name===term){
        return 0;
      }

      if(name.startsWith(term)){
        return 1;
      }

      return 2;
    };

    const as=score(an);
    const bs=score(bn);

    if(as!==bs){
      return as-bs;
    }

    return a.localeCompare(
      b,
      'ja'
    );
  });


  statusEl.textContent=
    term
      ? `検索結果：${found.length}件`
      : `スキル：${found.length}件`;


  results.innerHTML=
    found.length
      ? found.map(skillCard).join('')
      : '<div class="empty">該当するスキルがありません。</div>';
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
      : 'スキル名を入力';
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


function render(){

  if(mode==='skill'){
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


/* =========================
   オンライン表示
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
    './data.json?v=6',
    {cache:'no-store'}
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
    './skills.json?v=6',
    {cache:'no-store'}
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
.then(([monsterData,skillData])=>{

  DB=monsterData;

  SKILL_DB=skillData;

  updateTabs();

  render();

})
.catch(err=>{

  console.error(err);

  statusEl.textContent=
    'データ読み込みエラー';

  results.innerHTML=
    '<div class="empty">data.json または skills.json を確認してください。</div>';

});


if('serviceWorker' in navigator){

  navigator.serviceWorker
    .register('./sw.js?v=6')
    .catch(()=>{});
}
