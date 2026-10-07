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
    .replace(/[\sã»ï½¥ã¼]/g,'');
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
  const seasons=(location.seasons||[]).join('ã»');

  return `
    <div class="location-row">
      <div class="location-name">
        ð ${esc(location.name)}
      </div>

      <div class="location-detail">
        ${seasons?`å­£ç¯ï¼${esc(seasons)}`:''}
        ${location.weather?`ãå¤©åï¼${esc(location.weather)}`:''}
        ${location.miniBoss?'ããããã¹':''}
      </div>
    </div>
  `;
}

function locationsHtml(monster){
  const locations=monster.locations||[];

  if(!locations.length){
    return `
      <div class="small">
        éçåºç¾ãªãï¼æªç»é²
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
        åµããã®å¥æãªã
      </div>
    `;
  }

  return `
    <div class="eggs">
      ${eggs.map(egg=>`
        <div class="egg-row">
          <span class="egg-icon">ð¥</span>
          <strong>${esc(egg.name)}ã®åµ</strong>
          ${
            egg.postGameOnly
              ? `<span class="egg-postgame">ã¯ãªã¢å¾</span>`
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
        ã¹ã­ã«ãã¼ã¿æªç»é²
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
              <span class="talent-label">åºæ¬</span>
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
                è¿½å åè£
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
        ãªãï¼æªç»é²
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
        Sãµã¤ãº
      </div>

      ${traitRows(traits.S||[])}

      <div class="trait-size-title large">
        Lãµã¤ãºè¿½å ç¹æ§
      </div>

      ${traitRows(traits.L||[])}
    </div>
  `;
}

function recipeText(r){
  const parents=(r.parents||[])
    .map(monsterButton)
    .join(' ï¼ ');

  return `
    <div class="route">
      <span class="rtype">
        ${esc(r.type||'éå')}
      </span>

      ${parents}

      <span class="arrow">â</span>

      ${esc(r.result||'')}
    </div>
  `;
}

function useText(u){
  const other=(u.otherParents||[])
    .map(monsterButton)
    .join(' ï¼ ');

  return `
    <div class="route">
      <span class="rtype">
        ${esc(u.type||'éå')}
      </span>

      ${esc(u.source||'')}

      ${other?`ï¼ ${other}`:''}

      <span class="arrow">â</span>

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
        éåã§ã®å¥æãªãï¼æªç»é²
      </div>
    `;

  const uses=(m.uses||[])
    .map(useText)
    .join('')
    || `
      <div class="small">
        ç¹æ®ãªéååãªãï¼æªç»é²
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
            ? `<span class="badge">${esc(m.rank)}ã©ã³ã¯</span>`
            : ''
        }

        ${
          m.family
            ? `<span class="badge">${esc(m.family)}</span>`
            : ''
        }
      </div>

      <h2>ð ææã¹ã­ã«</h2>
      ${monsterTalentsHtml(m)}

      <h2>â­ ç¹æ§</h2>
      ${monsterTraitsHtml(m)}

      <h2>ð çæ¯å°</h2>
      ${locationsHtml(m)}

      <h2>ð¥ åµããã®å¥æ</h2>
      ${eggsHtml(m)}

      <h2>ð§¬ ãã®ã¢ã³ã¹ã¿ã¼ã®ä½ãæ¹</h2>
      ${recipes}

      <h2>ãã®ã¢ã³ã¹ã¿ã¼ãä½¿ãéåå</h2>
      ${uses}
    </section>
  `;
}

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
        `${x.name}ã®åµ`,
        x.postGameOnly?'ã¯ãªã¢å¾':''
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
      ? `æ¤ç´¢çµæï¼${found.length}ä½`
      : `ç»é²ï¼${DB.monsters.length}ä½`;

  results.innerHTML=
    found.length
      ? found.map(monsterCard).join('')
      : `
        <div class="empty">
          è©²å½ããã¢ã³ã¹ã¿ã¼ãããã¾ããã
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
            type:'çµã¿åãã',
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
          type:'é²å',
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
            type:'çµã¿åãã',
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
            type:'é²å',
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
    .join(' ï¼ ');

  return `
    <div class="route skillroute">
      <span class="rtype">
        ${esc(route.type||'é²å')}
      </span>

      ${parents}

      <span class="arrow">â</span>

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
        ç¹æã»å¹æãã¼ã¿æªç»é²
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
                æå¤§ ${esc(skill.maxPoints)}P
              </span>
            `
            : ''
        }
      </div>

      <h2>è¦ããç¹æã»å¹æ</h2>
      ${abilityTable(skill)}

      <h2>ãã®ã¹ã­ã«ã®ä½ãæ¹</h2>
      ${
        recipes.length
          ? recipes.map(skillRoute).join('')
          : `
            <div class="small">
              ä½ææ¡ä»¶ãªãï¼æªç»é²
            </div>
          `
      }

      <h2>ãã®ã¹ã­ã«ããä½ãããã®</h2>
      ${
        uses.length
          ? uses.map(skillRoute).join('')
          : `
            <div class="small">
              ä¸ä½ã¹ã­ã«ãªãï¼æªç»é²
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
      ? `æ¤ç´¢çµæï¼${found.length}ä»¶`
      : `ã¹ã­ã«ï¼${found.length}ä»¶`;

  results.innerHTML=
    found.length
      ? found.map(skillCard).join('')
      : `
        <div class="empty">
          è©²å½ããã¹ã­ã«ãããã¾ããã
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
    `${egg.name}ã®åµ`
    +
    (
      egg.postGameOnly
        ? 'ï¼ã¯ãªã¢å¾ï¼'
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
                        .join(' ï¼ ')
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
              ð ${esc(location)}
            </div>
          `
          : ''
      }

      ${
        egg
          ? `
            <div class="plan-egg">
              ð¥ ${esc(egg)}
            </div>
          `
          : ''
      }

      ${routeSelect}

      ${
        node.cycle
          ? `
            <div class="small">
              å¾ªç°ããéåã®ããå±éåæ­¢
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
        ð å¿è¦ç´ æã¯ãã¹ã¦æºåæ¸ã¿ã§ã
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
              Ã${count}
            </span>
          </div>

          ${
            locations.length
              ? `
                <div class="material-location">
                  ð
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
                  ð¥
                  ${esc(
                    eggs
                      .map(
                        egg=>
                          `${egg.name}ã®åµ${
                            egg.postGameOnly
                              ? 'ï¼ã¯ãªã¢å¾ï¼'
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
      'ä½ãããã¢ã³ã¹ã¿ã¼ãå¥åãã¦ãã ãã';

    results.innerHTML=`
      <div class="empty">
        ä¸ã®æ¬ããç®æ¨ã¢ã³ã¹ã¿ã¼ãé¸ã³ã
        ãéåã«ã¼ããä½æããæ¼ãã¦ãã ããã
      </div>
    `;

    return;
  }

  const monster=findMonster(target);

  if(!monster){
    statusEl.textContent=
      'ã¢ã³ã¹ã¿ã¼ãè¦ã¤ããã¾ãã';

    results.innerHTML=`
      <div class="empty">
        æ­£ããã¢ã³ã¹ã¿ã¼åãé¸æãã¦ãã ããã
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
    `ç®æ¨ï¼${target}`;

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
        ä½ææ¸ã¿ï¼
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
        ãã§ãã¯ããã¹ã¦è§£é¤
      </button>
    </section>

    <section class="card">
      <h2 class="plan-title">
        éåç³»çµ±å³
      </h2>

      <div class="plan-tree">
        ${planNodeHtml(root)}
      </div>
    </section>

    <section class="card">
      <h2 class="plan-title">
        æ®ãå¿è¦ç´ æ
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
      'ã¢ã³ã¹ã¿ã¼ãè¦ã¤ããã¾ãã';

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
      'ã¢ã³ã¹ã¿ã¼åã»ã¹ã­ã«ã»ç¹æ§ã»çæ¯å°ã»åµãå¥å';

    sortRow.style.display=
      'flex';
  }

  if(mode==='skill'){
    q.placeholder=
      'ã¹ã­ã«åã»ç¹æåãå¥å';

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
      ? 'ãªã³ã©ã¤ã³'
      : 'ãªãã©ã¤ã³';
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
    './data.json?v=11',
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
    './skills.json?v=11',
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
    'ãã¼ã¿èª­ã¿è¾¼ã¿ã¨ã©ã¼';

  results.innerHTML=`
    <div class="empty">
      data.json ã¾ãã¯
      skills.json ãç¢ºèªãã¦ãã ããã
    </div>
  `;
});

if('serviceWorker' in navigator){
  navigator.serviceWorker
    .register(
      './sw.js?v=11'
    )
    .catch(error=>
      console.warn(
        'Service Worker error',
        error
      )
    );
}
