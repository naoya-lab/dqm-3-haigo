let DB={monsters:[]};
let SKILL_DB={skills:[]};
let mode='monster';

const q=document.getElementById('q');
const results=document.getElementById('results');
const statusEl=document.getElementById('status');
const net=document.getElementById('net');
const monsterTab=document.getElementById('monsterTab');
const skillTab=document.getElementById('skillTab');
const planTab=document.getElementById('planTab');
const sortSelect=document.getElementById('sortSelect');
const sortRow=document.getElementById('sortRow');
const normalSearch=document.getElementById('normalSearch');
const planControls=document.getElementById('planControls');
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

function findMonster(name){
  return DB.monsters.find(m=>m.name===name);
}

function imgUrl(name){
  return 'https://www.google.com/search?tbm=isch&q='
    +encodeURIComponent('DQM3 '+name);
}

function jumpMonster(name){
  mode='monster';
  updateTabs();
  q.value=name;
  render();
  scrollTo({top:0,behavior:'smooth'});
}

function jumpSkill(name){
  mode='skill';
  updateTabs();
  q.value=name;
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

  return traits.map(trait=>`
    <div class="trait-row">
      <span class="trait-level">
        Lv${esc(trait.level)}
      </span>

      <div class="trait-content">
        <div class="trait-name">
          ${esc(trait.name)}
        </div>

        ${
          trait.description
            ? `
              <div class="trait-description">
                ${esc(trait.description)}
              </div>
            `
            : ''
        }
      </div>
    </div>
  `).join('');
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

function compareMonsters(a,b,term){
  if(term){
    const as=searchScore(a.name,term);
    const bs=searchScore(b.name,term);

    if(as!==bs){
      return as-bs;
    }
  }

  if(sortSelect.value==='name'){
    const aa=a.reading||a.name||'';
    const bb=b.reading||b.name||'';

    const c=String(aa)
      .localeCompare(
        String(bb),
        'ja'
      );

    if(c!==0){
      return c;
    }
  }

  if(sortSelect.value==='rank'){
    const order={
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
      order[
        String(a.rank||'').toUpperCase()
      ]
      ??99;

    const br=
      order[
        String(b.rank||'').toUpperCase()
      ]
      ??99;

    if(ar!==br){
      return ar-br;
    }
  }

  if(sortSelect.value==='family'){
    const c=String(a.family||'')
      .localeCompare(
        String(b.family||''),
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

    return (
      !term
      ||
      norm(text).includes(term)
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
      ? `\u691c\u7d22\u7d50\u679c\uff1a${found.length}\u4f53`
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
          .map(ability=>`
            <div class="skillability">
              <span class="skillpoints">
                ${esc(ability.points)}P
              </span>

              <span class="abilityname">
                ${esc(ability.name)}
              </span>
            </div>
          `)
          .join('')
      }
    </div>
  `;
}

function skillCard(name){
  const skill=findSkill(name);
  const recipes=skillRecipesFor(name);
  const uses=skillUsesFor(name);

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

  const isPlan=
    mode==='plan';

  normalSearch.hidden=
    isPlan;

  planControls.hidden=
    !isPlan;

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
    './data.json?v=12',
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
    './skills.json?v=12',
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
  })
])
.then(
  ([
    monsterData,
    skillData
  ])=>{
    DB=monsterData;
    SKILL_DB=skillData;

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
      data.json \u307e\u305f\u306f
      skills.json \u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002
    </div>
  `;
});

if('serviceWorker' in navigator){
  navigator.serviceWorker
    .register(
      './sw.js?v=12'
    )
    .catch(error=>
      console.warn(
        'Service Worker error',
        error
      )
    );
}
