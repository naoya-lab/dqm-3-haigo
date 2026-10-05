let DB={monsters:[]};
let SKILL_DB={skills:[]};

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
   移動
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
   卵
===================================== */

function eggsHtml(monster){

  const eggs=
    monster.eggs||[];


  if(!eggs.length){

    return `
      <div class="small">
        卵からの入手なし
      </div>
    `;
  }


  return `
    <div class="eggs">

      ${
        eggs
          .map(egg=>`

            <div class="egg-row">

              <span class="egg-icon">
                🥚
              </span>

              <strong>
                ${esc(egg.name)}の卵
              </strong>

              ${
                egg.postGameOnly
                  ? `
                      <span class="egg-postgame">
                        クリア後
                      </span>
                    `
                  : ''
              }

            </div>

          `)
          .join('')
      }

    </div>
  `;
}


function eggSummary(monster){

  return (
    monster?.eggs||[]
  )
    .map(
      egg=>
        `${egg.name}の卵${
          egg.postGameOnly
            ? '（クリア後）'
            : ''
        }`
    );
}


/* =====================================
   配合
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
        🌍 生息地
      </h2>

      ${locationsHtml(m)}


      <h2>
        🥚 卵からの入手
      </h2>

      ${eggsHtml(m)}


      <h2>
        🧬 このモンスターの作り方
      </h2>

      ${recipes}


      <h2>
        このモンスターを使う配合先
      </h2>

      ${uses}

    </section>
 
