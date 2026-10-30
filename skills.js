// Classic scripts share the existing global scope; see DEVELOPING.md for load order.
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


