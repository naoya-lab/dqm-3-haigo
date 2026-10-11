let DB={monsters:[]};
let SKILL_DB={skills:[]};
let ABILITY_DETAILS={};
let TRAIT_DETAILS={};
let mode='monster';
let monsterSearchValue='';
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
const planControls=document.getElementById('planControls');
const recommendControls=document.getElementById('recommendControls');
const recommendTarget=document.getElementById('recommendTarget');
const recommendStrategy=document.getElementById('recommendStrategy');
const recommendFormation=document.getElementById('recommendFormation');
const planTarget=document.getElementById('planTarget');
const buildPlanButton=document.getElementById('buildPlan');
const monsterOptions=document.getElementById('monsterOptions');

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

window.jumpMonster=jumpMonster;
window.jumpSkill=jumpSkill;

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

function locationText(location){
  const seasons=(location.seasons||[]).join('\u30fb');

  return `
    <div class="location-row">
      <div class="location-name">
        \ud83d\udccd ${esc(location.name)}
      </div>

      <div class="location-detail">
        ${seasons?`\u5b63\u7bc0\uff1a${esc(seasons)}`:''}
        ${location.weather?`\u3000\u5929\u5019\uff1a${esc(location.weather)}`:''}
        ${location.miniBoss?'\u3000\u30df\u30cb\u30dc\u30b9':''}
      </div>
    </div>
  `;
}

function locationsHtml(monster){
  const locations=monster.locations||[];

  if(!locations.length){
    return `
      <div class="small">
        \u91ce\u751f\u51fa\u73fe\u306a\u3057\uff0f\u672a\u767b\u9332
      </div>
    `;
  }

  return `
    <div class="locations">
      ${locations.map(locationText).join('')}
    </div>
  `;
}

function eggsHtml(monster){
  const eggs=monster.eggs||[];

  if(!eggs.length){
    return `
      <div class="small">
        \u5375\u304b\u3089\u306e\u5165\u624b\u306a\u3057
      </div>
    `;
  }

  return `
    <div class="eggs">
      ${eggs.map(egg=>`
        <div class="egg-row">
          <span class="egg-icon">\ud83e\udd5a</span>
          <strong>${esc(egg.name)}\u306e\u5375</strong>
          ${
            egg.postGameOnly
              ? `<span class="egg-postgame">\u30af\u30ea\u30a2\u5f8c</span>`
              : ''
          }
        </div>
      `).join('')}
    </div>
  `;
}

function monsterTalentsHtml(monster){
  const talents=monster.talents||[];

  if(!talents.length){
    return `
      <div class="small">
        \u30b9\u30ad\u30eb\u30c7\u30fc\u30bf\u672a\u767b\u9332
      </div>
    `;
  }

  const primary=talents.filter(x=>x.primary);
  const others=talents.filter(x=>!x.primary);

  return `
    <div class="monster-talents">
      ${
        primary.length
          ? `
            <div class="monster-talent-row">
              <span class="talent-label">\u57fa\u672c</span>
              ${
                primary
                  .map(x=>skillButton(x.name))
                  .join(' / ')
              }
            </div>
          `
          : ''
      }

      ${
        others.length
          ? `
            <div class="monster-talent-row">
              <span class="talent-label secondary">
                \u8ffd\u52a0\u5019\u88dc
              </span>
              ${
                others
                  .map(x=>skillButton(x.name))
                  .join(' / ')
              }
            </div>
          `
          : ''
      }
    </div>
  `;
}

function traitRows(traits){
  if(!traits.length){
    return `
      <div class="small">
        \u306a\u3057\uff0f\u672a\u767b\u9332
      </div>
    `;
  }

  return traits.map(trait=>{
    const detail=traitDetail(trait.name);
    const description=
      detail?.description
      ||trait.description
      ||'';

    return `
      <div class="trait-row">
        <span class="trait-level">
          Lv${esc(trait.level)}
        </span>

        <div class="trait-content">
          <div class="trait-name-line">
            <div class="trait-name">
              ${esc(trait.name)}
            </div>

            ${detail?.category ? `
              <span class="trait-category">
                ${esc(detail.category)}
              </span>
            ` : ''}
          </div>

          ${description ? `
            <div class="trait-description">
              ${esc(description)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function monsterTraitsHtml(monster){
  const traits=monster.traits||{
    S:[],
    L:[]
  };

  return `
    <div class="monster-traits">
      <div class="trait-size-title">
        S\u30b5\u30a4\u30ba
      </div>

      ${traitRows(traits.S||[])}

      <div class="trait-size-title large">
        L\u30b5\u30a4\u30ba\u8ffd\u52a0\u7279\u6027
      </div>

      ${traitRows(traits.L||[])}
    </div>
  `;
}

function recipeText(r){
  const parents=(r.parents||[])
    .map(monsterButton)
    .join(' \uff0b ');

  return `
    <div class="route">
      <span class="rtype">
        ${esc(r.type||'\u914d\u5408')}
      </span>

      ${parents}

      <span class="arrow">\u2192</span>

      ${esc(r.result||'')}
    </div>
  `;
}

function useText(u){
  const other=(u.otherParents||[])
    .map(monsterButton)
    .join(' \uff0b ');

  return `
    <div class="route">
      <span class="rtype">
        ${esc(u.type||'\u914d\u5408')}
      </span>

      ${esc(u.source||'')}

      ${other?`\uff0b ${other}`:''}

      <span class="arrow">\u2192</span>

      ${monsterButton(u.result)}
    </div>
  `;
}

const STAT_FIELDS=[
  ['hp','\u6700\u5927HP'],
  ['mp','\u6700\u5927MP'],
  ['attack','\u653b\u6483\u529b'],
  ['defence','\u5b88\u5099\u529b'],
  ['agility','\u3059\u3070\u3084\u3055'],
  ['wisdom','\u304b\u3057\u3053\u3055']
];

function percentile(sorted,p){
  if(!sorted.length) return 0;
  const index=(sorted.length-1)*p;
  const lower=Math.floor(index);
  const upper=Math.ceil(index);
  if(lower===upper) return sorted[lower];
  const weight=index-lower;
  return sorted[lower]*(1-weight)+sorted[upper]*weight;
}

function prepareStatThresholds(){
  STAT_THRESHOLDS={};
  STAT_FIELDS.forEach(([key])=>{
    const values=DB.monsters
      .map(m=>Number(m.stats?.[key]||0))
      .filter(v=>v>0)
      .sort((a,b)=>a-b);
    STAT_THRESHOLDS[key]=[
      percentile(values,.2),
      percentile(values,.4),
      percentile(values,.6),
      percentile(values,.8)
    ];
  });
}

function statStars(key,value){
  const n=Number(value||0);
  if(!n) return '\u2606\u2606\u2606\u2606\u2606';
  const t=STAT_THRESHOLDS[key]||[];
  let stars=1;
  t.forEach(limit=>{ if(n>limit) stars+=1; });
  stars=Math.min(5,stars);
  return '\u2605'.repeat(stars)+'\u2606'.repeat(5-stars);
}

function statPercentileScore(key,value){
  const n=Number(value||0);
  if(!n) return 0;
  const values=DB.monsters
    .map(m=>Number(m.stats?.[key]||0))
    .filter(v=>v>0)
    .sort((a,b)=>a-b);
  if(!values.length) return 0;
  let low=0;
  let high=values.length;
  while(low<high){
    const mid=(low+high)>>1;
    if(values[mid]<=n) low=mid+1;
    else high=mid;
  }
  return Math.max(0,Math.min(1,low/values.length));
}

function statBlend(monster,weights){
  const stats=monster.stats||{};
  let total=0;
  let weightSum=0;
  Object.entries(weights).forEach(([key,weight])=>{
    total+=statPercentileScore(key,stats[key])*weight;
    weightSum+=weight;
  });
  return weightSum ? total/weightSum : 0;
}
function monsterStatsHtml(monster){
  const stats=monster.stats||{};
  const hasStats=STAT_FIELDS.some(([key])=>Number(stats[key]||0)>0);
  if(!hasStats){
    return '<div class="small">\u30b9\u30c6\u30fc\u30bf\u30b9\u30c7\u30fc\u30bf\u672a\u53cd\u6620</div>';
  }
  return `
    <div class="stat-grid">
      ${STAT_FIELDS.map(([key,label])=>{
        const value=Number(stats[key]||0);
        const stars=statStars(key,value);
        return `
          <div class="stat-row">
            <div class="stat-label">${label}</div>
            <div class="stat-value">${value||'-'}</div>
            <div class="stat-stars">${stars}</div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="stat-note">
      \u2605\u306f\u5168526\u4f53\u306e\u6700\u5927\u5024\u5206\u5e03\u30925\u6bb5\u968e\u306b\u5206\u3051\u305f\u76f8\u5bfe\u8a55\u4fa1\u3067\u3059\u3002
    </div>
  `;
}

function monsterCard(m){
  const recipes=(m.recipes||[])
    .map(recipeText)
    .join('')
    || `
      <div class="small">
        \u914d\u5408\u3067\u306e\u5165\u624b\u306a\u3057\uff0f\u672a\u767b\u9332
      </div>
    `;

  const uses=(m.uses||[])
    .map(useText)
    .join('')
    || `
      <div class="small">
        \u7279\u6b8a\u306a\u914d\u5408\u5148\u306a\u3057\uff0f\u672a\u767b\u9332
      </div>
    `;

  const cardId=`monster-${m.no}`;

  return `
    <section class="card">
      <div class="monster-card-header">
        <div class="name">
          <a
            target="_blank"
            rel="noopener"
            href="${imgUrl(m.name)}"
          >
            ${esc(m.name)}
          </a>
        </div>

        <button
          class="collapse-button"
          type="button"
          aria-expanded="false"
          aria-controls="${cardId}"
          onclick="toggleMonsterCard('${cardId}',this)"
        >
          &#9654;
        </button>
      </div>

      <div
        id="${cardId}"
        class="monster-card-body"
        hidden
      >
        <div class="meta">
          ${
            m.no
              ? `<span class="badge">No.${esc(m.no)}</span>`
              : ''
          }

          ${
            m.rank
              ? `<span class="badge">${esc(m.rank)}\u30e9\u30f3\u30af</span>`
              : ''
          }

          ${
            m.family
              ? `<span class="badge">${esc(m.family)}</span>`
              : ''
          }
        </div>

        <h2>\ud83d\udcca \u6700\u5927\u30b9\u30c6\u30fc\u30bf\u30b9</h2>
        ${monsterStatsHtml(m)}

        <h2>\ud83d\udcd8 \u6240\u6301\u30b9\u30ad\u30eb</h2>
        ${monsterTalentsHtml(m)}

        <h2>\u2b50 \u7279\u6027</h2>
        ${monsterTraitsHtml(m)}

        <h2>\ud83c\udf0d \u751f\u606f\u5730</h2>
        ${locationsHtml(m)}

        <h2>\ud83e\udd5a \u5375\u304b\u3089\u306e\u5165\u624b</h2>
        ${eggsHtml(m)}

        <h2>\ud83e\uddec \u3053\u306e\u30e2\u30f3\u30b9\u30bf\u30fc\u306e\u4f5c\u308a\u65b9</h2>
        ${recipes}

        <h2>\u3053\u306e\u30e2\u30f3\u30b9\u30bf\u30fc\u3092\u4f7f\u3046\u914d\u5408\u5148</h2>
        ${uses}
      </div>
    </section>
  `;
}

window.toggleMonsterCard=function(id,button){
  const body=document.getElementById(id);

  if(!body){
    return;
  }

  const willOpen=body.hidden;
  body.hidden=!willOpen;

  button.textContent=
    willOpen
      ? '\u25bc'
      : '\u25b6';

  button.setAttribute(
    'aria-expanded',
    willOpen
      ? 'true'
      : 'false'
  );
};

function searchScore(name,term){
  if(!term) return 0;

  const value=norm(name);

  if(value===term) return 0;
  if(value.startsWith(term)) return 1;
  if(value.includes(term)) return 2;

  return 3;
}

function selectedFilterValues(container){
  if(!container) return [];
  return [...container.querySelectorAll('input[type="checkbox"]:checked')]
    .map(input=>input.value);
}

function renderMonsterFilters(){
  const rankOrder=['X','S','A','B','C','D','E','F','G'];
  const availableRanks=new Set(
    DB.monsters
      .map(m=>String(m.rank||'').toUpperCase())
      .filter(Boolean)
  );

  rankFilters.innerHTML=
    rankOrder
      .filter(rank=>availableRanks.has(rank))
      .map(rank=>`
        <label class="filter-chip">
          <input
            type="checkbox"
            value="${esc(rank)}"
          >
          <span>${esc(rank)}ランク</span>
        </label>
      `)
      .join('');

  const families=[...new Set(
    DB.monsters
      .map(m=>String(m.family||'').trim())
      .filter(Boolean)
  )].sort((a,b)=>a.localeCompare(b,'ja'));

  familyFilters.innerHTML=
    families
      .map(family=>`
        <label class="filter-chip">
          <input
            type="checkbox"
            value="${esc(family)}"
          >
          <span>${esc(family)}</span>
        </label>
      `)
      .join('');
}

function monsterMatchesFilters(monster){
  const ranks=selectedFilterValues(rankFilters);
  const families=selectedFilterValues(familyFilters);

  const rankOk=
    !ranks.length
    ||ranks.includes(String(monster.rank||'').toUpperCase());

  const familyOk=
    !families.length
    ||families.includes(String(monster.family||''));

  return rankOk && familyOk;
}

function compareMonsters(a,b,term){
  if(term){
    const as=searchScore(a.name,term);
    const bs=searchScore(b.name,term);

    if(as!==bs){
      return as-bs;
    }
  }

  let result=0;

  if(sortSelect.value==='name'){
    const aa=a.reading||a.name||'';
    const bb=b.reading||b.name||'';
    result=String(aa).localeCompare(String(bb),'ja');
  }
  else if(sortSelect.value==='rank'){
    const order={
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

    const ar=order[String(a.rank||'').toUpperCase()]??99;
    const br=order[String(b.rank||'').toUpperCase()]??99;
    result=ar-br;
  }
  else if(sortSelect.value==='family'){
    result=String(a.family||'')
      .localeCompare(String(b.family||''),'ja');
  }
  else{
    result=(a.no??9999)-(b.no??9999);
  }

  if(result===0 && sortSelect.value!=='number'){
    result=(a.no??9999)-(b.no??9999);
  }

  return sortDirection.value==='desc'
    ? -result
    : result;
}

function renderMonsters(){
  const term=norm(q.value);

  const found=DB.monsters.filter(m=>{
    const locations=(m.locations||[])
      .flatMap(x=>[
        x.name,
        ...(x.seasons||[]),
        x.weather
      ]);

    const eggs=(m.eggs||[])
      .flatMap(x=>[
        x.name,
        `${x.name}\u306e\u5375`,
        x.postGameOnly?'\u30af\u30ea\u30a2\u5f8c':''
      ]);

    const text=[
      m.name,
      m.reading,
      m.rank,
      m.family,
      m.no,

      ...(m.talents||[])
        .map(x=>x.name),

      ...(m.traits?.S||[])
        .flatMap(x=>[
          x.name,
          x.description
        ]),

      ...(m.traits?.L||[])
        .flatMap(x=>[
          x.name,
          x.description
        ]),

      ...locations,
      ...eggs,

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

    const searchOk=
      !term
      ||norm(text).includes(term);

    return (
      searchOk
      &&monsterMatchesFilters(m)
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

  const hasFilters=
    selectedFilterValues(rankFilters).length
    ||selectedFilterValues(familyFilters).length;

  statusEl.textContent=
    (term||hasFilters)
      ? `\u8868\u793a\uff1a${found.length}\u4f53 / \u5168${DB.monsters.length}\u4f53`
      : `\u767b\u9332\uff1a${DB.monsters.length}\u4f53`;

  results.innerHTML=
    found.length
      ? found.map(monsterCard).join('')
      : `
        <div class="empty">
          \u8a72\u5f53\u3059\u308b\u30e2\u30f3\u30b9\u30bf\u30fc\u304c\u3042\u308a\u307e\u305b\u3093\u3002
        </div>
      `;
}

function allSkillNames(){
  const names=new Set();

  SKILL_DB.skills.forEach(skill=>{
    if(skill.name){
      names.add(skill.name);
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
          names.add(evo.result);
        }

        (evo.required||[])
          .forEach(req=>{
            if(req.skill){
              names.add(req.skill);
            }
          });
      });
  });

  return [...names];
}

function findSkill(name){
  return SKILL_DB.skills.find(
    skill=>skill.name===name
  );
}

function uniqueObjects(items){
  const seen=new Set();

  return items.filter(item=>{
    const key=JSON.stringify(item);

    if(seen.has(key)){
      return false;
    }

    seen.add(key);
    return true;
  });
}

function skillRecipesFor(name){
  const recipes=[];

  SKILL_DB.skills.forEach(skill=>{
    if(skill.name===name){
      (skill.recipes||[])
        .forEach(recipe=>{
          recipes.push({
            type:'\u7d44\u307f\u5408\u308f\u305b',
            parents:recipe,
            result:skill.name,
            note:skill.note||''
          });
        });
    }

    (skill.evolvesTo||[])
      .forEach(evo=>{
        if(evo.result!==name){
          return;
        }

        recipes.push({
          type:'\u9032\u5316',
          parents:(evo.required||[])
            .map(
              req=>
                `${req.skill} ${req.points}P`
            ),
          result:evo.result,
          note:evo.note||''
        });
      });
  });

  return uniqueObjects(recipes);
}

function skillUsesFor(name){
  const uses=[];

  SKILL_DB.skills.forEach(skill=>{
    (skill.recipes||[])
      .forEach(recipe=>{
        if(recipe.includes(name)){
          uses.push({
            type:'\u7d44\u307f\u5408\u308f\u305b',
            parents:recipe,
            result:skill.name,
            note:skill.note||''
          });
        }
      });

    (skill.evolvesTo||[])
      .forEach(evo=>{
        const required=evo.required||[];

        if(
          required.some(
            req=>req.skill===name
          )
        ){
          uses.push({
            type:'\u9032\u5316',
            parents:required.map(
              req=>
                `${req.skill} ${req.points}P`
            ),
            result:evo.result,
            note:evo.note||''
          });
        }
      });
  });

  return uniqueObjects(uses);
}

function skillRoute(route){
  const parents=(route.parents||[])
    .map(value=>{
      const match=String(value)
        .match(
          /^(.*?)(?:\s+(\d+)P)?$/
        );

      const skillName=
        match
          ? match[1]
          : value;

      const points=
        match&&match[2]
          ? ` ${match[2]}P`
          : '';

      return (
        skillButton(skillName)
        +
        `<strong>${esc(points)}</strong>`
      );
    })
    .join(' \uff0b ');

  return `
    <div class="route skillroute">
      <span class="rtype">
        ${esc(route.type||'\u9032\u5316')}
      </span>

      ${parents}

      <span class="arrow">\u2192</span>

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
  const abilities=skill?.abilities||[];

  if(!abilities.length){
    return `
      <div class="small">
        \u7279\u6280\u30fb\u52b9\u679c\u30c7\u30fc\u30bf\u672a\u767b\u9332
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
          .map(ability=>{
            const isTrait=ability.type==='trait';
            const detail=isTrait
              ? traitDetail(ability.name)
              : ABILITY_DETAILS[ability.name];

            return `
              <div class="skillability">
                <div class="skillability-main">
                  <span class="skillpoints">
                    ${esc(ability.points)}P
                  </span>

                  <span class="abilityname">
                    ${esc(ability.name)}
                  </span>

                  ${detail ? `
                    <span class="ability-class">
                      ${esc(detail.category)}
                    </span>

                    ${
                      !isTrait && detail.mp!==undefined
                        ? `<span class="ability-mp">MP ${esc(detail.mp)}</span>`
                        : ''
                    }
                  ` : ''}
                </div>

                ${detail?.description ? `
                  <div class="ability-description">
                    ${esc(detail.description)}
                  </div>
                ` : ''}
              </div>
            `;
          })
          .join('')
      }
    </div>
  `;
}

function skillHolders(name){
  return DB.monsters
    .filter(monster=>
      (monster.talents||[])
        .some(talent=>talent.name===name)
    )
    .sort((a,b)=>
      Number(a.no||9999)-Number(b.no||9999)
    );
}

function skillDescription(skill){
  if(!skill){
    return '\u8a73\u7d30\u30c7\u30fc\u30bf\u304c\u672a\u767b\u9332\u306e\u30b9\u30ad\u30eb\u3067\u3059\u3002';
  }

  const abilities=skill.abilities||[];
  const active=abilities
    .filter(x=>x.type==='skill')
    .map(x=>x.name)
    .filter(Boolean);
  const passive=abilities
    .filter(x=>x.type==='trait')
    .map(x=>x.name)
    .filter(Boolean);

  const parts=[];

  if(active.length){
    const names=active.slice(0,3).map(x=>`\u300c${x}\u300d`).join('\u30fb');
    parts.push(`${names}${active.length>3?'\u306a\u3069':''}\u306e\u7279\u6280\u30fb\u546a\u6587\u3092\u7fd2\u5f97\u3067\u304d\u308b\u3002`);
  }

  if(passive.length){
    const names=passive.slice(0,3).map(x=>`\u300c${x}\u300d`).join('\u30fb');
    parts.push(`${names}${passive.length>3?'\u306a\u3069':''}\u306e\u80fd\u529b\u4e0a\u6607\u30fb\u7279\u6027\u3082\u7fd2\u5f97\u3067\u304d\u308b\u3002`);
  }

  if(!parts.length){
    parts.push('\u7fd2\u5f97\u5185\u5bb9\u306e\u8a73\u7d30\u306f\u672a\u767b\u9332\u3067\u3059\u3002');
  }

  if(skill.category){
    parts.push(`\u5206\u985e\uff1a${skill.category}\u3002`);
  }

  return parts.join('');
}

function skillHolderHtml(monster){
  return `
    <div class="skill-holder-row">
      ${monsterButton(monster.name)}
      ${monster.rank?`<span class="mini-badge">${esc(monster.rank)}\u30e9\u30f3\u30af</span>`:''}
      ${monster.family?`<span class="mini-badge">${esc(monster.family)}</span>`:''}
    </div>
  `;
}

window.toggleSkillHolders=function(id,button){
  const body=document.getElementById(id);
  if(!body) return;
  const willOpen=body.hidden;
  body.hidden=!willOpen;
  button.textContent=(willOpen?'\u25bc':'\u25b6')+button.dataset.label;
  button.setAttribute('aria-expanded',willOpen?'true':'false');
};
function skillCard(name){
  const skill=findSkill(name);
  const recipes=skillRecipesFor(name);
  const uses=skillUsesFor(name);
  const holders=skillHolders(name);
  const holderId='skill-holders-'+encodeURIComponent(name).replace(/%/g,'');
  const holderLabel=` \u3053\u306e\u30b9\u30ad\u30eb\u3092\u6301\u3064\u30e2\u30f3\u30b9\u30bf\u30fc\uff08${holders.length}\u4f53\uff09`;

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
                \u6700\u5927 ${esc(skill.maxPoints)}P
              </span>
            `
            : ''
        }
        ${
          skill?.category
            ? `<span class="badge">${esc(skill.category)}</span>`
            : ''
        }
      </div>

      <div class="skill-description">
        ${esc(skillDescription(skill))}
      </div>

      <div class="skill-holder-section">
        <button
          class="skill-holder-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="${holderId}"
          data-label="${esc(holderLabel)}"
          onclick="toggleSkillHolders('${holderId}',this)"
        >
          \u25b6${esc(holderLabel)}
        </button>

        <div
          id="${holderId}"
          class="skill-holder-list"
          hidden
        >
          ${
            holders.length
              ? holders.map(skillHolderHtml).join('')
              : `
                <div class="small">
                  \u73fe\u5728\u306e\u56f3\u9451\u30c7\u30fc\u30bf\u3067\u306f\u6240\u6301\u30e2\u30f3\u30b9\u30bf\u30fc\u306f\u672a\u767b\u9332\u3067\u3059\u3002
                </div>
              `
          }
        </div>
      </div>

      <h2>\u899a\u3048\u308b\u7279\u6280\u30fb\u52b9\u679c</h2>
      ${abilityTable(skill)}

      <h2>\u3053\u306e\u30b9\u30ad\u30eb\u306e\u4f5c\u308a\u65b9</h2>
      ${
        recipes.length
          ? recipes.map(skillRoute).join('')
          : `
            <div class="small">
              \u4f5c\u6210\u6761\u4ef6\u306a\u3057\uff0f\u672a\u767b\u9332
            </div>
          `
      }

      <h2>\u3053\u306e\u30b9\u30ad\u30eb\u304b\u3089\u4f5c\u308c\u308b\u3082\u306e</h2>
      ${
        uses.length
          ? uses.map(skillRoute).join('')
          : `
            <div class="small">
              \u4e0a\u4f4d\u30b9\u30ad\u30eb\u306a\u3057\uff0f\u672a\u767b\u9332
            </div>
          `
      }
    </section>
  `;
}

function renderSkills(){
  const term=norm(q.value);

  const found=allSkillNames()
    .filter(name=>{
      const skill=findSkill(name);

      const abilityText=
        (skill?.abilities||[])
          .map(x=>{
            const detail=
              x.type==='trait'
                ? traitDetail(x.name)
                : ABILITY_DETAILS[x.name];

            return [
              x.name,
              detail?.category||'',
              detail?.description||''
            ].join(' ');
          })
          .join(' ');

      const holderText=
        skillHolders(name)
          .map(x=>x.name)
          .join(' ');

      const description=
        skillDescription(skill);

      return (
        !term
        ||
        norm(
          `${name} ${abilityText} ${holderText} ${description}`
        ).includes(term)
      );
    })
    .sort((a,b)=>{
      const as=searchScore(a,term);
      const bs=searchScore(b,term);

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
      ? `\u691c\u7d22\u7d50\u679c\uff1a${found.length}\u4ef6`
      : `\u30b9\u30ad\u30eb\uff1a${found.length}\u4ef6`;

  results.innerHTML=
    found.length
      ? found.map(skillCard).join('')
      : `
        <div class="empty">
          \u8a72\u5f53\u3059\u308b\u30b9\u30ad\u30eb\u304c\u3042\u308a\u307e\u305b\u3093\u3002
        </div>
      `;
}


const REC_CONFIG={
  fire:{
    label:'\u706b',
    icon:'\ud83d\udd25',
    kind:'element',
    traits:['\u706b\u306e\u30b3\u30c4','\u706b\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u30b2\u30de','\u3084\u307e\u305f\u306e\u304a\u308d\u3061'],
    skills:['\u706b\u306e\u6975\u610f','\u30b0\u30e9\u30f3\u30b9\u30da\u30ebSP','MP\u30a2\u30c3\u30d74']
  },
  water:{
    label:'\u6c34',
    icon:'\ud83d\udca7',
    kind:'element',
    traits:['\u6c34\u306e\u30b3\u30c4','\u6c34\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u3046\u305a\u3057\u304a\u30ad\u30f3\u30b0','\u30a4\u30eb\u30ab\u3061\u3087\u3046\u3061\u3093'],
    skills:['\u6c34\u306e\u6975\u610f','\u30b0\u30e9\u30f3\u30b9\u30da\u30ebSP','MP\u30a2\u30c3\u30d74']
  },
  wind:{
    label:'\u98a8',
    icon:'\ud83c\udf2a\ufe0f',
    kind:'element',
    traits:['\u98a8\u306e\u30b3\u30c4','\u98a8\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u30d0\u30ba\u30ba','\u30b2\u30ea\u30e5\u30aa\u30f3'],
    skills:['\u98a8\u306e\u6975\u610f','\u30b0\u30e9\u30f3\u30b9\u30da\u30ebSP','MP\u30a2\u30c3\u30d74']
  },
  earth:{
    label:'\u5730',
    icon:'\ud83e\udea8',
    kind:'element',
    traits:['\u5730\u306e\u30b3\u30c4','\u5730\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u307e\u304b\u3044\u3058\u3085\u3046','\u30c9\u30ed\u30b6\u30e9\u30fc'],
    skills:['\u5730\u306e\u6975\u610f','\u653b\u6483\u529b\u30a2\u30c3\u30d74','HP\u30a2\u30c3\u30d74']
  },
  explosion:{
    label:'\u7206\u767a',
    icon:'\ud83d\udca5',
    kind:'element',
    traits:['\u7206\u767a\u306e\u30b3\u30c4','\u7206\u767a\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u30a2\u30fc\u30af\u30c7\u30fc\u30e2\u30f3','\u304c\u3044\u3053\u3064\u3051\u3093\u3057'],
    skills:['\u7206\u767a\u306e\u6975\u610f','\u30b0\u30e9\u30f3\u30b9\u30da\u30ebSP','MP\u30a2\u30c3\u30d74']
  },
  ice:{
    label:'\u6c37\u7d50',
    icon:'\u2744\ufe0f',
    kind:'element',
    traits:['\u6c37\u7d50\u306e\u30b3\u30c4','\u6c37\u7d50\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u30ea\u30fc\u30ba\u30ec\u30c3\u30c8','\u30db\u30fc\u30af\u30d6\u30ea\u30b6\u30fc\u30c9'],
    skills:['\u6c37\u7d50\u306e\u6975\u610f','\u30b0\u30e9\u30f3\u30b9\u30da\u30ebSP','MP\u30a2\u30c3\u30d74']
  },
  electric:{
    label:'\u96fb\u6483',
    icon:'\u26a1',
    kind:'element',
    traits:['\u96fb\u6483\u306e\u30b3\u30c4','\u96fb\u6483\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u30b7\u30eb\u30d0\u30fc\u30ca\u30fc\u30ac','\u30ad\u30e9\u30fc\u30de\u30b8\u30f3\u30ac'],
    skills:['\u96fb\u6483\u306e\u6975\u610f','\u30b0\u30e9\u30f3\u30b9\u30da\u30ebSP','MP\u30a2\u30c3\u30d74']
  },
  light:{
    label:'\u5149',
    icon:'\u2728',
    kind:'element',
    traits:['\u5149\u306e\u30b3\u30c4','\u5149\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u30ed\u30a4\u30e4\u30eb\u30d6\u30eb\u30fc\u30e0','\u30ed\u30c3\u30af\u3061\u3087\u3046'],
    skills:['\u5149\u306e\u6975\u610f','\u30b0\u30e9\u30f3\u30b9\u30da\u30ebSP','MP\u30a2\u30c3\u30d74']
  },
  dark:{
    label:'\u95c7',
    icon:'\ud83c\udf11',
    kind:'element',
    traits:['\u95c7\u306e\u30b3\u30c4','\u95c7\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u3088\u308b\u306e\u3066\u3044\u304a\u3046'],
    skills:['\u95c7\u306e\u6975\u610f','\u30b0\u30e9\u30f3\u30b9\u30da\u30ebSP','MP\u30a2\u30c3\u30d74']
  },
  critical:{
    label:'\u4f1a\u5fc3',
    icon:'\ud83d\udca5',
    kind:'critical',
    traits:[
      '\u8d85\u4f1a\u5fc3\u7387\u30a2\u30c3\u30d7',
      '\u4f1a\u5fc3\u7387\u30a2\u30c3\u30d7\u5927',
      '\u30d4\u30f3\u30c1\u3067\u4f1a\u5fc3'
    ],
    preferred:[],
    skills:[
      '\u653b\u6483\u529b\u30a2\u30c3\u30d74',
      '\u3059\u3070\u3084\u3055\u30a2\u30c3\u30d74',
      'HP\u30a2\u30c3\u30d74'
    ]
  },
  sleep:{
    label:'\u7720\u308a',
    icon:'\ud83d\ude34',
    kind:'status',
    traits:['\u306d\u3080\u308a\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u3088\u308b\u306e\u3066\u3044\u304a\u3046','\u308f\u3089\u3044\u3076\u304f\u308d'],
    skills:['\u7720\u308a\u7cfb\u30b9\u30ad\u30eb','\u3059\u3070\u3084\u3055\u30a2\u30c3\u30d74','HP\u30a2\u30c3\u30d74']
  },
  confusion:{
    label:'\u6df7\u4e71',
    icon:'\ud83c\udf00',
    kind:'status',
    traits:['\u3053\u3093\u3089\u3093\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u30dd\u30f3\u30dd\u30b3\u3060\u306c\u304d','\u30a2\u30fc\u30af\u30c7\u30fc\u30e2\u30f3'],
    skills:['\u6df7\u4e71\u7cfb\u30b9\u30ad\u30eb','\u3059\u3070\u3084\u3055\u30a2\u30c3\u30d74','HP\u30a2\u30c3\u30d74']
  },
  paralysis:{
    label:'\u30de\u30d2',
    icon:'\u26a1',
    kind:'status',
    traits:['\u30de\u30d2\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u30b7\u30eb\u30d0\u30fc\u30ca\u30fc\u30ac'],
    skills:['\u30de\u30d2\u7cfb\u30b9\u30ad\u30eb','\u3059\u3070\u3084\u3055\u30a2\u30c3\u30d74','HP\u30a2\u30c3\u30d74']
  },
  stun:{
    label:'\u4f11\u307f',
    icon:'\ud83d\udcab',
    kind:'status',
    traits:['\u4f11\u307f\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u30d5\u30a7\u30a2\u30ea\u30fc\u30c9\u30e9\u30b4\u30f3','\u307e\u304b\u3044\u3058\u3085\u3046'],
    skills:['\u4f11\u307f\u7cfb\u30b9\u30ad\u30eb','\u3059\u3070\u3084\u3055\u30a2\u30c3\u30d74','HP\u30a2\u30c3\u30d74']
  },
  poison:{
    label:'\u6bd2',
    icon:'\u2620\ufe0f',
    kind:'status',
    traits:['\u3069\u304f\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u30d0\u30c3\u30d5\u30a1\u30ed\u30f3'],
    skills:['\u6bd2\u7cfb\u30b9\u30ad\u30eb','\u3059\u3070\u3084\u3055\u30a2\u30c3\u30d74','HP\u30a2\u30c3\u30d74']
  },
  blind:{
    label:'\u5e7b\u60d1',
    icon:'\ud83c\udf2b\ufe0f',
    kind:'status',
    traits:['\u5e7b\u60d1\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u30d5\u30a7\u30a2\u30ea\u30fc\u30c9\u30e9\u30b4\u30f3','\u30c9\u30ed\u30b6\u30e9\u30fc'],
    skills:['\u5e7b\u60d1\u7cfb\u30b9\u30ad\u30eb','\u3059\u3070\u3084\u3055\u30a2\u30c3\u30d74','HP\u30a2\u30c3\u30d74']
  },
  seal:{
    label:'\u5c01\u3058',
    icon:'\ud83d\udd12',
    kind:'status',
    traits:['\u5c01\u3058\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u30d0\u30c3\u30d5\u30a1\u30ed\u30f3','\u30c9\u30ed\u30b6\u30e9\u30fc'],
    skills:['\u5c01\u3058\u7cfb\u30b9\u30ad\u30eb','\u3059\u3070\u3084\u3055\u30a2\u30c3\u30d74','HP\u30a2\u30c3\u30d74']
  },
  debuff:{
    label:'\u5f31\u4f53\u5316',
    icon:'\ud83d\udcc9',
    kind:'status',
    traits:['\u5f31\u4f53\u5316\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u304c\u3044\u3053\u3064\u3051\u3093\u3057','\u304d\u308a\u304b\u3076\u304a\u3070\u3051'],
    skills:['\u5f31\u4f53\u5316\u7cfb\u30b9\u30ad\u30eb','\u3059\u3070\u3084\u3055\u30a2\u30c3\u30d74','HP\u30a2\u30c3\u30d74']
  },
  death:{
    label:'\u5373\u6b7b',
    icon:'\ud83d\udc80',
    kind:'status',
    traits:['\u5373\u6b7b\u30d6\u30ec\u30a4\u30af\u5927'],
    preferred:['\u30d6\u30e9\u30d0\u30cb\u30af\u30a4\u30fc\u30f3'],
    skills:['\u5373\u6b7b\u7cfb\u30b9\u30ad\u30eb','\u3059\u3070\u3084\u3055\u30a2\u30c3\u30d74','HP\u30a2\u30c3\u30d74']
  }
};

function recTraitNames(monster,size='S'){
  const base=(monster.traits?.S||[])
    .map(x=>x.name)
    .filter(Boolean);

  if(size!=='L'){
    return base;
  }

  const extra=(monster.traits?.L||[])
    .map(x=>x.name)
    .filter(Boolean);

  return [...new Set([...base,...extra])];
}

function recTalentNames(monster){
  return (monster.talents||[])
    .map(x=>x.name)
    .filter(Boolean);
}

function recScore(monster,cfg,size='S'){
  const traits=recTraitNames(monster,size);
  let traitScore=0;

  cfg.traits.forEach((name,index)=>{
    if(!traits.includes(name)) return;

    if(cfg.kind==='critical'){
      traitScore+=[
        10,
        7,
        4
      ][index]||3;
    }
    else{
      traitScore+=index===0?5:7;
    }
  });

  const preferredIndex=cfg.preferred.indexOf(monster.name);
  if(preferredIndex>=0){
    traitScore+=6-preferredIndex;
  }

  if(traitScore<=0){
    return 0;
  }

  let statScore=0;

  if(cfg.kind==='critical'){
    statScore=statBlend(monster,{
      attack:0.75,
      agility:0.15,
      hp:0.10
    });

    return traitScore*0.65 + statScore*10*0.35;
  }

  if(cfg.kind==='status'){
    if(traits.some(x=>x.includes('\u30d6\u30ec\u30a4\u30af\u5927'))){
      traitScore+=1;
    }

    statScore=statBlend(monster,{
      agility:0.6,
      hp:0.2,
      defence:0.2
    });

    return traitScore*0.60 + statScore*10*0.40;
  }

  const physical=statBlend(monster,{
    attack:0.75,
    agility:0.15,
    hp:0.10
  });

  const magical=statBlend(monster,{
    wisdom:0.65,
    mp:0.25,
    agility:0.10
  });

  statScore=Math.max(physical,magical);

  return traitScore*0.60 + statScore*10*0.40;
}

function recNormalize100(items){
  if(!items.length) return items;
  const sorted=[...items]
    .map(x=>Number(x.rawScore??x.score??0))
    .sort((a,b)=>a-b);

  return items.map(item=>{
    const value=Number(item.rawScore??item.score??0);
    let count=0;
    for(const x of sorted){
      if(x<=value) count++;
    }
    const score100=Math.round((count/sorted.length)*100);
    return {...item,score100};
  });
}

function recStars100(score100){
  const n=Math.max(0,Math.min(100,Number(score100||0)));
  let value=1;
  if(n>=60) value=2;
  if(n>=70) value=3;
  if(n>=80) value=4;
  if(n>=90) value=5;
  return '\u2605'.repeat(value)+'\u2606'.repeat(5-value);
}

function recScoreLabel(score100){
  const n=Math.max(0,Math.min(100,Math.round(Number(score100||0))));
  return `${n}\u70b9 / ${recStars100(n)}`;
}

function recPercentile100(values,value){
  const sorted=values
    .map(Number)
    .filter(v=>Number.isFinite(v) && v>0)
    .sort((a,b)=>a-b);
  if(!sorted.length) return 0;
  let count=0;
  for(const x of sorted){
    if(x<=Number(value||0)) count++;
  }
  return Math.round((count/sorted.length)*100);
}
function recCandidates(cfg,size='S'){
  const raw=DB.monsters
    .map(monster=>({
      monster,
      rawScore:recScore(monster,cfg,size),
      size
    }))
    .filter(x=>x.rawScore>0);

  return recNormalize100(raw)
    .sort((a,b)=>
      b.rawScore-a.rawScore
      ||
      String(a.monster.no||'').localeCompare(
        String(b.monster.no||''),
        'ja',
        {numeric:true}
      )
    );
}

function recReason(monster,cfg){
  const traits=recTraitNames(monster);
  const matched=cfg.traits.filter(x=>traits.includes(x));

  if(matched.length){
    return matched.join(' + ');
  }

  if(cfg.kind==='critical'){
    return '\u4f1a\u5fc3\u7cfb\u7279\u6027 + \u7269\u7406\u30b9\u30c6\u30fc\u30bf\u30b9\u304b\u3089\u9078\u51fa';
  }

  if(cfg.preferred.includes(monster.name)){
    return '\u3053\u306e\u30c6\u30fc\u30de\u306e\u63a8\u5968\u5019\u88dc';
  }

  return '\u7279\u6027\u69cb\u6210\u304b\u3089\u9078\u51fa';
}

function recSkillHtml(name){
  if(findSkill(name)){
    return skillButton(name);
  }

  return `<span class="rec-skill">${esc(name)}</span>`;
}

function recRecommendedSkills(cfg,role){
  if(role==='\u307f\u304c\u308f\u308a\u30fb\u8010\u4e45'){
    return ['\u9a0e\u58eb\u9053','HP\u30a2\u30c3\u30d74','\u5b88\u5099\u529b\u30a2\u30c3\u30d74'];
  }

  if(role==='\u56de\u5fa9'){
    return ['\u8d85\u56de\u5fa9SP','MP\u30a2\u30c3\u30d74','\u3059\u3070\u3084\u3055\u30a2\u30c3\u30d74'];
  }

  return cfg.skills;
}

function recPickByName(name,used){
  const monster=findMonster(name);
  if(!monster || used.has(monster.name)){
    return null;
  }

  used.add(monster.name);
  return monster;
}

function recPickCandidate(candidates,used){
  const item=candidates.find(
    x=>!used.has(x.monster.name)
  );

  if(!item){
    return null;
  }

  used.add(item.monster.name);
  return item.monster;
}

function recFallbackHealer(used){
  const exact=recPickByName('\u30d9\u30db\u30de\u30b9\u30e9\u30a4\u30e0',used);
  if(exact){
    return exact;
  }

  const monster=DB.monsters.find(m=>
    !used.has(m.name)
    &&
    recTalentNames(m).some(name=>
      name.includes('\u56de\u5fa9')
      ||
      name.includes('\u30d2\u30fc\u30e9\u30fc')
    )
  );

  if(monster){
    used.add(monster.name);
  }

  return monster||null;
}

function recFallbackTank(used){
  const exact=recPickByName('\u30b4\u30fc\u30eb\u30c7\u30f3\u30b9\u30e9\u30a4\u30e0',used);
  if(exact){
    return exact;
  }

  const monster=DB.monsters.find(m=>
    !used.has(m.name)
    &&
    recTraitNames(m).some(name=>
      name.includes('\u30e1\u30bf\u30eb\u30dc\u30c7\u30a3')
      ||
      name.includes('\u304f\u3058\u3051\u306c\u5fc3')
    )
  );

  if(monster){
    used.add(monster.name);
  }

  return monster||null;
}

function recTankScore(monster,size='S'){
  const traits=recTraitNames(monster,size);
  const talents=recTalentNames(monster);
  let traitScore=0;
  const reasons=[];

  if(monster.name==='\u30b4\u30fc\u30eb\u30c7\u30f3\u30b9\u30e9\u30a4\u30e0'){
    traitScore+=10;
    reasons.push('\u9ad8\u8010\u4e45\u306e\u5b9a\u756a\u5019\u88dc');
  }

  if(talents.some(x=>x.includes('\u9a0e\u58eb\u9053'))){
    traitScore+=8;
    reasons.push('\u9a0e\u58eb\u9053');
  }

  const checks=[
    ['\u8d85\u30cf\u30fc\u30c9\u30e1\u30bf\u30eb\u30dc\u30c7\u30a3',9],
    ['\u30cf\u30fc\u30c9\u30e1\u30bf\u30eb\u30dc\u30c7\u30a3',8],
    ['\u30e1\u30bf\u30eb\u30dc\u30c7\u30a3',7],
    ['\u304f\u3058\u3051\u306c\u5fc3',4],
    ['\u4f1a\u5fc3\u304b\u3093\u305c\u3093\u30ac\u30fc\u30c9',4],
    ['\u30ae\u30e3\u30f3\u30d6\u30eb\u30dc\u30c7\u30a3',2]
  ];

  checks.forEach(([name,points])=>{
    if(traits.some(x=>x.includes(name))){
      traitScore+=points;
      reasons.push(name);
    }
  });

  const statScore=statBlend(monster,{
    hp:0.5,
    defence:0.5
  });

  const score=traitScore*0.50 + statScore*10*0.50;

  return {
    monster,
    score,
    reason:[...new Set(reasons)].slice(0,3).join(' + ')
  };
}

function recHealerScore(monster,size='S'){
  const traits=recTraitNames(monster,size);
  const talents=recTalentNames(monster);
  let traitScore=0;
  const reasons=[];

  if(monster.name==='\u30d9\u30db\u30de\u30b9\u30e9\u30a4\u30e0'){
    traitScore+=10;
    reasons.push('\u56de\u5fa9\u5f79\u306e\u5b9a\u756a\u5019\u88dc');
  }

  talents.forEach(name=>{
    if(name.includes('\u8d85\u56de\u5fa9SP')){
      traitScore+=10;
      reasons.push('\u8d85\u56de\u5fa9SP');
    }
    else if(name.includes('\u56de\u5fa9') || name.includes('\u30d2\u30fc\u30e9\u30fc')){
      traitScore+=6;
      reasons.push(name);
    }
  });

  const checks=[
    ['\u56de\u5fa9\u306e\u30b3\u30c4',7],
    ['\u81ea\u52d5HP\u56de\u5fa9',3],
    ['\u81ea\u52d5MP\u56de\u5fa9',3],
    ['\u9b54\u529b\u306e\u98a8',2],
    ['\u9b54\u529b\u306e\u5f37\u98a8',3],
    ['\u7652\u3057\u306e\u529b',3],
    ['\u7652\u3057\u306e\u5927\u529b',4]
  ];

  checks.forEach(([name,points])=>{
    if(traits.some(x=>x.includes(name))){
      traitScore+=points;
      reasons.push(name);
    }
  });

  const statScore=statBlend(monster,{
    wisdom:0.4,
    mp:0.4,
    agility:0.2
  });

  const score=traitScore*0.50 + statScore*10*0.50;

  return {
    monster,
    score,
    reason:[...new Set(reasons)].slice(0,3).join(' + ')
  };
}

function recTankCandidates(size='S'){
  const raw=DB.monsters
    .map(monster=>{
      const item=recTankScore(monster,size);
      return {...item,rawScore:item.score};
    })
    .filter(x=>x.rawScore>0);

  return recNormalize100(raw)
    .sort((a,b)=>b.rawScore-a.rawScore)
    .slice(0,5);
}

function recHealerCandidates(size='S'){
  const raw=DB.monsters
    .map(monster=>{
      const item=recHealerScore(monster,size);
      return {...item,rawScore:item.score};
    })
    .filter(x=>x.rawScore>0);

  return recNormalize100(raw)
    .sort((a,b)=>b.rawScore-a.rawScore)
    .slice(0,5);
}

function recRoleCandidateHtml(item,role,size='S'){
  const breakdown=recRoleBreakdown(item.monster,role,size);
  const skills=role==='tank'
    ? ['\u9a0e\u58eb\u9053','HP\u30a2\u30c3\u30d74','\u5b88\u5099\u529b\u30a2\u30c3\u30d74']
    : ['\u8d85\u56de\u5fa9SP','MP\u30a2\u30c3\u30d74','\u3059\u3070\u3084\u3055\u30a2\u30c3\u30d74'];

  return `
    <div class="role-candidate">
      <div class="role-candidate-head">
        <div>${monsterButton(item.monster.name)}</div>
        <span class="role-score">${recScoreLabel(item.score100)}</span>
      </div>
      <div class="role-reason">
        ${esc(item.reason||'\u5f79\u5272\u9069\u6027\u304b\u3089\u9078\u51fa')}
      </div>
      ${recBreakdownHtml(breakdown,'\u7279\u6027\u9069\u6027')}
      <div class="role-skills">
        ${skills.map(recSkillHtml).join(' / ')}
      </div>
    </div>
  `;
}

function recBestRoleCandidate(role,size,used){
  const list=role==='tank'
    ? recTankCandidates(size)
    : recHealerCandidates(size);

  const item=list.find(x=>!used.has(x.monster.name));
  if(!item) return null;
  used.add(item.monster.name);
  return item.monster;
}

function recBestThemeCandidate(cfg,size,used){
  const item=recCandidates(cfg,size)
    .find(x=>!used.has(x.monster.name));
  if(!item) return null;
  used.add(item.monster.name);
  return item.monster;
}
function buildRecommendedTeam(cfg,strategy,formation='SSSS'){
  const used=new Set();
  const team=[];

  const add=(monster,role,size)=>{
    if(monster){
      team.push({monster,role,size});
    }
  };

  if(formation==='LSS'){
    add(
      recBestThemeCandidate(cfg,'L',used),
      cfg.kind!=='status' ? '\u30e1\u30a4\u30f3L\u30a2\u30bf\u30c3\u30ab\u30fc' : '\u30e1\u30a4\u30f3L\u4ed8\u4e0e\u5f79',
      'L'
    );

    if(strategy==='stable'){
      add(recBestRoleCandidate('tank','S',used),'\u307f\u304c\u308f\u308a\u30fb\u8010\u4e45','S');
      add(recBestRoleCandidate('healer','S',used),'\u56de\u5fa9','S');
    }
    else{
      add(recBestThemeCandidate(cfg,'S',used),strategy==='control'?'\u59a8\u5bb3\u88dc\u52a9':'\u30b5\u30d6\u30a2\u30bf\u30c3\u30ab\u30fc','S');
      add(recBestRoleCandidate('healer','S',used),'\u56de\u5fa9','S');
    }
  }
  else if(formation==='LL'){
    add(
      recBestThemeCandidate(cfg,'L',used),
      cfg.kind!=='status' ? '\u30e1\u30a4\u30f3L\u30a2\u30bf\u30c3\u30ab\u30fc' : '\u30e1\u30a4\u30f3L\u4ed8\u4e0e\u5f79',
      'L'
    );

    if(strategy==='stable'){
      const tank=recTankCandidates('L').find(x=>!used.has(x.monster.name));
      const healer=recHealerCandidates('L').find(x=>!used.has(x.monster.name));
      const support=(
        (tank?.rawScore||0)>=(healer?.rawScore||0)
          ? {item:tank,role:'\u307f\u304c\u308f\u308a\u30fb\u8010\u4e45'}
          : {item:healer,role:'\u56de\u5fa9'}
      );
      if(support.item){
        used.add(support.item.monster.name);
        add(support.item.monster,support.role,'L');
      }
    }
    else{
      add(
        recBestThemeCandidate(cfg,'L',used),
        strategy==='control' ? '\u59a8\u5bb3\u88dc\u52a9' : '\u30b5\u30d6L\u30a2\u30bf\u30c3\u30ab\u30fc',
        'L'
      );
    }
  }
  else{
    add(
      recBestThemeCandidate(cfg,'S',used),
      cfg.kind!=='status' ? '\u30e1\u30a4\u30f3\u30a2\u30bf\u30c3\u30ab\u30fc' : '\u30e1\u30a4\u30f3\u4ed8\u4e0e\u5f79',
      'S'
    );
    add(
      recBestThemeCandidate(cfg,'S',used),
      cfg.kind!=='status' ? '\u30b5\u30d6\u30a2\u30bf\u30c3\u30ab\u30fc' : '\u30b5\u30d6\u4ed8\u4e0e\u30fb\u653b\u6483',
      'S'
    );

    if(strategy==='power'){
      add(recBestThemeCandidate(cfg,'S',used),'\u706b\u529b\u88dc\u52a9','S');
      add(recBestRoleCandidate('healer','S',used),'\u56de\u5fa9','S');
    }
    else if(strategy==='control'){
      add(recBestThemeCandidate(cfg,'S',used),cfg.kind==='status'?'\u59a8\u5bb3\u88dc\u52a9':'\u706b\u529b\u30fb\u59a8\u5bb3\u88dc\u52a9','S');
      add(recBestRoleCandidate('healer','S',used),'\u56de\u5fa9','S');
    }
    else{
      add(recBestRoleCandidate('tank','S',used),'\u307f\u304c\u308f\u308a\u30fb\u8010\u4e45','S');
      add(recBestRoleCandidate('healer','S',used),'\u56de\u5fa9','S');
    }
  }

  const candidates=[
    ...recCandidates(cfg,'S'),
    ...recCandidates(cfg,'L')
  ];

  return {team,candidates};
}

function recStars(score){
  return recStars100(score);
}

function recTraitBaseScore(monster,cfg,size='S'){
  const traits=recTraitNames(monster,size);
  let traitScore=0;
  cfg.traits.forEach((name,index)=>{
    if(!traits.includes(name)) return;

    if(cfg.kind==='critical'){
      traitScore+=[
        10,
        7,
        4
      ][index]||3;
    }
    else{
      traitScore+=index===0?5:7;
    }
  });
  const preferredIndex=cfg.preferred.indexOf(monster.name);
  if(preferredIndex>=0){
    traitScore+=6-preferredIndex;
  }
  if(cfg.kind==='status' && traits.some(x=>x.includes('\u30d6\u30ec\u30a4\u30af\u5927'))){
    traitScore+=1;
  }
  return traitScore;
}

function recAttackBreakdown(monster,cfg,size='S'){
  const traitScore=recTraitBaseScore(monster,cfg,size);
  const traitValues=DB.monsters
    .map(m=>recTraitBaseScore(m,cfg,size))
    .filter(v=>v>0);
  const trait100=recPercentile100(traitValues,traitScore);
  const stats=monster.stats||{};

  if(cfg.kind==='critical'){
    const statScore=statBlend(monster,{
      attack:0.75,
      agility:0.15,
      hp:0.10
    });

    return {
      traitScore:trait100,
      statScore:Math.round(statScore*100),
      type:'\u4f1a\u5fc3\u7269\u7406\u578b',
      fields:[
        ['attack','\u653b\u6483\u529b',stats.attack],
        ['agility','\u3059\u3070\u3084\u3055',stats.agility],
        ['hp','HP',stats.hp]
      ]
    };
  }

  if(cfg.kind==='status'){
    const statScore=statBlend(monster,{agility:0.6,hp:0.2,defence:0.2});
    return {
      traitScore:trait100,
      statScore:Math.round(statScore*100),
      type:'\u72b6\u614b\u7570\u5e38\u578b',
      fields:[
        ['agility','\u3059\u3070\u3084\u3055',stats.agility],
        ['hp','HP',stats.hp],
        ['defence','\u5b88\u5099\u529b',stats.defence]
      ]
    };
  }

  const physical=statBlend(monster,{attack:0.75,agility:0.15,hp:0.10});
  const magical=statBlend(monster,{wisdom:0.65,mp:0.25,agility:0.10});

  if(physical>=magical){
    return {
      traitScore:trait100,
      statScore:Math.round(physical*100),
      type:'\u7269\u7406\u578b',
      fields:[
        ['attack','\u653b\u6483\u529b',stats.attack],
        ['agility','\u3059\u3070\u3084\u3055',stats.agility],
        ['hp','HP',stats.hp]
      ]
    };
  }

  return {
    traitScore:trait100,
    statScore:Math.round(magical*100),
    type:'\u546a\u6587\u578b',
    fields:[
      ['wisdom','\u304b\u3057\u3053\u3055',stats.wisdom],
      ['mp','MP',stats.mp],
      ['agility','\u3059\u3070\u3084\u3055',stats.agility]
    ]
  };
}

function recRoleBreakdown(monster,role,size='S'){
  const stats=monster.stats||{};
  if(role==='tank'){
    const item=recTankScore(monster,size);
    const statScore=Math.round(statBlend(monster,{hp:0.5,defence:0.5})*100);
    return {
      statScore,
      type:'\u307f\u304c\u308f\u308a\u578b',
      fields:[
        ['hp','HP',stats.hp],
        ['defence','\u5b88\u5099\u529b',stats.defence]
      ],
      total:item.score
    };
  }
  const item=recHealerScore(monster,size);
  const statScore=Math.round(statBlend(monster,{wisdom:0.4,mp:0.4,agility:0.2})*100);
  return {
    statScore,
    type:'\u56de\u5fa9\u578b',
    fields:[
      ['wisdom','\u304b\u3057\u3053\u3055',stats.wisdom],
      ['mp','MP',stats.mp],
      ['agility','\u3059\u3070\u3084\u3055',stats.agility]
    ],
    total:item.score
  };
}

function recBreakdownHtml(info,traitLabel='\u7279\u6027\u52a0\u70b9'){
  return `
    <div class="rec-breakdown">
      <div class="rec-breakdown-title">\u8a55\u4fa1\u5185\u8a33 \u30fb ${esc(info.type)}</div>
      ${info.traitScore!==undefined ? `
        <div class="rec-breakdown-row">
          <span>${traitLabel}</span>
          <strong>${Math.round(Number(info.traitScore||0))} / 100</strong>
        </div>
      ` : ''}
      <div class="rec-breakdown-row">
        <span>\u30b9\u30c6\u30fc\u30bf\u30b9\u9069\u6027</span>
        <strong>${Math.round(Number(info.statScore||0))} / 100</strong>
      </div>
      <div class="rec-used-stats">
        ${(info.fields||[]).map(([key,label,value])=>`
          <div class="rec-used-stat">
            <span>${label}</span>
            <strong>${Number(value||0)||'-'}</strong>
            <span class="rec-used-stars">${statStars(key,value)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function recommendationCard(item,index,cfg,candidates){
  const monster=item.monster;
  const score100=(
    candidates.find(
      x=>x.monster.name===monster.name
        &&x.size===item.size
    )?.score100
    ||0
  );

  const skills=recRecommendedSkills(
    cfg,
    item.role
  );

  const breakdown=recAttackBreakdown(
    monster,
    cfg,
    item.size||'S'
  );

  return `
    <section class="card rec-card">
      <div class="rec-rank">#${index+1}</div>

      <div class="rec-name">
        ${monsterButton(monster.name)}
      </div>

      <div class="rec-role">
        <span class="rec-size-badge ${item.size==='L'?'large':''}">
          ${item.size||'S'}
        </span>
        ${esc(item.role)}
      </div>

      <div class="rec-stars rec-score100">
        ${recScoreLabel(score100)}
      </div>

      <div class="rec-reason">
        <strong>\u9078\u51fa\u7406\u7531:</strong>
        ${esc(recReason(monster,cfg))}
      </div>

      ${recBreakdownHtml(breakdown)}

      <div class="rec-skills-title">
        \u63a8\u5968\u30b9\u30ad\u30eb
      </div>

      <div class="rec-skills">
        ${skills.map(recSkillHtml).join(' / ')}
      </div>

      <div class="rec-actions">
        <button
          class="mainbutton rec-action"
          type="button"
          onclick='jumpMonster(${JSON.stringify(monster.name)})'
        >
          \u56f3\u9451\u3067\u898b\u308b
        </button>

        <button
          class="clearbutton rec-action"
          type="button"
          onclick='openPlanFor(${JSON.stringify(monster.name)})'
        >
          \u914d\u5408\u30eb\u30fc\u30c8
        </button>
      </div>
    </section>
  `;
}

window.openPlanFor=function(name){
  mode='plan';
  planState.target=name;
  savePlanState();
  updateTabs();
  renderPlan();
  scrollTo({top:0,behavior:'smooth'});
};

function renderRecommendations(){
  const cfg=REC_CONFIG[
    recommendTarget.value
  ]||REC_CONFIG.fire;

  const strategy=
    recommendStrategy.value
    ||'stable';

  const formation=
    recommendFormation.value
    ||'SSSS';

  const built=
    buildRecommendedTeam(
      cfg,
      strategy,
      formation
    );

  const formationLabel={
    SSSS:'S \u00d7 4',
    LSS:'L \u00d7 1 + S \u00d7 2',
    LL:'L \u00d7 2'
  }[formation];

  const strategyText={
    stable:'\u5b89\u5b9a\u653b\u7565',
    power:'\u706b\u529b\u91cd\u8996',
    control:'\u59a8\u5bb3\u91cd\u8996'
  }[strategy];

  const roleSize=
    formation==='LL'
      ? 'L'
      : 'S';

  const tankCandidates=
    recTankCandidates(roleSize);

  const healerCandidates=
    recHealerCandidates(roleSize);

  const alternates=[];
  const seen=new Set(
    built.team.map(x=>x.monster.name)
  );

  built.candidates.forEach(item=>{
    if(alternates.length>=5) return;
    if(seen.has(item.monster.name)) return;
    seen.add(item.monster.name);
    alternates.push(item);
  });

  statusEl.textContent=
    `${cfg.icon} ${cfg.label} \u30fb ${formationLabel}`;

  results.innerHTML=`
    <section class="card rec-summary">
      <div class="skillname">
        ${cfg.icon} ${esc(cfg.label)}\u304a\u3059\u3059\u3081\u7de8\u6210
      </div>

      <div class="rec-summary-text">
        \u57fa\u672c\u69cb\u6210: ${esc(formationLabel)} / ${esc(strategyText)}
      </div>

      <div class="rec-summary-text">
        L\u30b5\u30a4\u30ba\u306fS\u7279\u6027\u306bL\u8ffd\u52a0\u7279\u6027\u3092\u52a0\u3048\u3066\u63a1\u70b9\u3057\u3001
        \u30c6\u30fc\u30de\u9069\u6027\u306e\u3042\u308b\u30e2\u30f3\u30b9\u30bf\u30fc\u306e\u4e2d\u304b\u3089
        \u6700\u5927\u30b9\u30c6\u30fc\u30bf\u30b9\u3082\u52a0\u5473\u3057\u3066\u9806\u4f4d\u4ed8\u3051\u3057\u3066\u3044\u307e\u3059\u3002
      </div>
    </section>

    <div class="rec-grid">
      ${built.team.length
        ? built.team
            .map((item,index)=>
              recommendationCard(
                item,
                index,
                cfg,
                built.candidates
              )
            )
            .join('')
        : `
            <section class="card">
              <div class="empty">
                \u3053\u306e\u6761\u4ef6\u3067\u9069\u5408\u3059\u308b\u5019\u88dc\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002
              </div>
            </section>
          `
      }
    </div>

    <section class="card role-section">
      <h2 class="plan-title">
        \ud83d\udee1\ufe0f \u307f\u304c\u308f\u308a\u5f79\u304a\u3059\u3059\u3081
      </h2>
      <div class="role-note">
        ${roleSize}\u30b5\u30a4\u30ba\u5019\u88dc\u3002
        \u9ad8\u8010\u4e45\u30fb\u30e1\u30bf\u30eb\u7cfb\u7279\u6027\u30fbHP\u30fb\u5b88\u5099\u529b\u3092\u512a\u5148\u3002
      </div>
      <div class="role-candidate-list">
        ${tankCandidates.length
          ? tankCandidates.map(x=>recRoleCandidateHtml(x,'tank',roleSize)).join('')
          : '<div class="small">\u5019\u88dc\u306a\u3057</div>'
        }
      </div>
    </section>

    <section class="card role-section">
      <h2 class="plan-title">
        \ud83d\udc9a \u56de\u5fa9\u5f79\u304a\u3059\u3059\u3081
      </h2>
      <div class="role-note">
        ${roleSize}\u30b5\u30a4\u30ba\u5019\u88dc\u3002
        \u56de\u5fa9\u7279\u6027\u30fb\u304b\u3057\u3053\u3055\u30fbMP\u30fb\u3059\u3070\u3084\u3055\u3092\u512a\u5148\u3002
      </div>
      <div class="role-candidate-list">
        ${healerCandidates.length
          ? healerCandidates.map(x=>recRoleCandidateHtml(x,'healer',roleSize)).join('')
          : '<div class="small">\u5019\u88dc\u306a\u3057</div>'
        }
      </div>
    </section>

    <section class="card">
      <h2 class="plan-title">
        \u5165\u308c\u66ff\u3048\u5019\u88dc
      </h2>

      ${alternates.length
        ? alternates.map(x=>`
            <div class="rec-alt">
              <span class="rec-size-badge ${x.size==='L'?'large':''}">
                ${x.size||'S'}
              </span>
              ${monsterButton(x.monster.name)}
              <span>
                ${esc(recReason(x.monster,cfg))}
              </span>
            </div>
          `).join('')
        : `
            <div class="small">
              \u8ffd\u52a0\u5019\u88dc\u304c\u3042\u308a\u307e\u305b\u3093\u3002
            </div>
          `
      }
    </section>

    <section class="card rec-note">
      <strong>\u6ce8\u610f</strong><br>
      \u30dc\u30b9\u306e\u8010\u6027\u3084\u884c\u52d5\u56de\u6570\u3001L\u8ffd\u52a0\u7279\u6027\u306b\u3088\u3063\u3066
      \u5b9f\u969b\u306e\u6700\u9069\u89e3\u306f\u5909\u308f\u308a\u307e\u3059\u3002
    </section>
  `;
}

const PLAN_KEY='dqm3-plan-v2';

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
    JSON.stringify(planState)
  );
}

function nodeKey(target,path){
  return target+'::'+path;
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
  const checked=
    Boolean(
      planState.checked[
        node.key
      ]
    );

  const indent=
    Math.min(depth,8);

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

  if(planState.checked[node.key]){
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

      <div class="progressbar">
        <div
          class="progressbar-inner"
          style="width:${progress}%"
        ></div>
      </div>

      <button
        class="clearbutton"
        onclick="clearPlanChecks()"
      >
        \u30c1\u30a7\u30c3\u30af\u3092\u3059\u3079\u3066\u89e3\u9664
      </button>
    </section>

    <section class="card">
      <h2 class="plan-title">
        \u914d\u5408\u7cfb\u7d71\u56f3
      </h2>

      <div class="plan-tree">
        ${planNodeHtml(root)}
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
  function(key,checked){
    planState.checked[key]=checked;
    savePlanState();
    renderPlan();
  };

window.changePlanRoute=
  function(key,value){
    planState.routes[key]=
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
      '\u30e2\u30f3\u30b9\u30bf\u30fc\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093';

    return;
  }

  planState.target=name;
  savePlanState();
  renderPlan();
}

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

  planControls.hidden=
    !isPlan;

  recommendControls.hidden=
    !isRecommend;

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
  }
}

monsterTab.addEventListener(
  'click',
  ()=>{
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
    updateTabs();
    render();
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

Promise.all([
  fetch(
    './data.json?v=33',
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
    './skills.json?v=33',
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
    './ability_details.json?v=33',
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
    './trait_details.json?v=33',
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
  })
])
.then(
  ([
    monsterData,
    skillData,
    abilityDetailData,
    traitDetailData
  ])=>{
    DB=monsterData;
    SKILL_DB=skillData;
    ABILITY_DETAILS=abilityDetailData.abilities||{};
    TRAIT_DETAILS=traitDetailData.traits||{};
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
      './sw.js?v=33'
    )
    .catch(error=>
      console.warn(
        'Service Worker error',
        error
      )
    );
}
