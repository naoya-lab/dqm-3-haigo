// Classic scripts share the existing global scope; see DEVELOPING.md for load order.
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
  const primary=talents.filter(x=>x.primary);

  if(!primary.length){
    return `
      <div class="small">
        \u306a\u3057\uff0f\u672a\u767b\u9332
      </div>
    `;
  }

  return `
    <div class="monster-talents">
      <div class="monster-talent-row">
        <span class="talent-label">\u57fa\u672c</span>
        ${
          primary
            .map(x=>skillButton(x.name))
            .join(' / ')
        }
      </div>
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

function monsterRecommendation(monster){
  const saved=MONSTER_RECOMMENDATIONS[monster.name];
  if(saved) return saved;

  const traits=[
    ...(monster.traits?.S||[]),
    ...(monster.traits?.L||[])
  ].map(x=>x.name);

  const stats=monster.stats||{};
  const attack=Number(stats.attack||0);
  const wisdom=Number(stats.wisdom||0);

  const statusMap=[
    ['\u3069\u304f\u30d6\u30ec\u30a4\u30af\u5927','\u3069\u304f\u59a8\u5bb3','\u30b8\u30e3\u30de\u30fc'],
    ['\u3053\u3093\u3089\u3093\u30d6\u30ec\u30a4\u30af\u5927','\u3053\u3093\u3089\u3093\u59a8\u5bb3','\u30b8\u30e3\u30de\u30fc'],
    ['\u306d\u3080\u308a\u30d6\u30ec\u30a4\u30af\u5927','\u306d\u3080\u308a\u59a8\u5bb3','\u30b8\u30e3\u30de\u30fc'],
    ['\u30de\u30d2\u30d6\u30ec\u30a4\u30af\u5927','\u30de\u30d2\u59a8\u5bb3','\u30b8\u30e3\u30de\u30fc'],
    ['\u4f11\u307f\u30d6\u30ec\u30a4\u30af\u5927','\u4f11\u307f\u59a8\u5bb3','\u30b8\u30e3\u30de\u30fc'],
    ['\u5e7b\u60d1\u30d6\u30ec\u30a4\u30af\u5927','\u5e7b\u60d1\u59a8\u5bb3','\u30b8\u30e3\u30de\u30fc'],
    ['\u5c01\u3058\u30d6\u30ec\u30a4\u30af\u5927','\u5c01\u3058\u59a8\u5bb3','\u30b8\u30e3\u30de\u30fc'],
    ['\u5f31\u4f53\u5316\u30d6\u30ec\u30a4\u30af\u5927','\u5f31\u4f53\u5316\u59a8\u5bb3','\u30b8\u30e3\u30de\u30fc'],
    ['\u5373\u6b7b\u30d6\u30ec\u30a4\u30af\u5927','\u5373\u6b7b\u59a8\u5bb3','\u30a2\u30b5\u30b7\u30f3'],
    ['MP\u5438\u53ce\u30d6\u30ec\u30a4\u30af\u5927','MP\u5438\u53ce\u59a8\u5bb3','\u30b8\u30e3\u30de\u30fc']
  ];

  for(const [trait,role,skill] of statusMap){
    if(traits.includes(trait)){
      return {
        role,
        skills:[skill,'\u3059\u3070\u3084\u3055\u30a2\u30c3\u30d74','HP\u30a2\u30c3\u30d74'],
        reason:`${trait}\u3092\u6d3b\u304b\u3057\u3066\u5148\u624b\u59a8\u5bb3\u3092\u72d9\u3046`
      };
    }
  }

  if(traits.includes('\u56de\u5fa9\u306e\u30b3\u30c4')){
    return {
      role:'\u56de\u5fa9',
      skills:['\u8d85\u56de\u5fa9SP','MP\u30a2\u30c3\u30d74','\u3059\u3070\u3084\u3055\u30a2\u30c3\u30d74'],
      reason:'\u56de\u5fa9\u306e\u30b3\u30c4\u3092\u6d3b\u304b\u3057\u3001\u56de\u5fa9\u91cf\u30fb\u7d99\u6226\u529b\u30fb\u884c\u52d5\u901f\u5ea6\u3092\u88dc\u3046'
    };
  }

  const elements=[
    ['\u706b','\u706b\u306e\u30b3\u30c4','\u706b\u30d6\u30ec\u30a4\u30af\u5927'],
    ['\u6c34','\u6c34\u306e\u30b3\u30c4','\u6c34\u30d6\u30ec\u30a4\u30af\u5927'],
    ['\u98a8','\u98a8\u306e\u30b3\u30c4','\u98a8\u30d6\u30ec\u30a4\u30af\u5927'],
    ['\u5730','\u5730\u306e\u30b3\u30c4','\u5730\u30d6\u30ec\u30a4\u30af\u5927'],
    ['\u7206\u767a','\u7206\u767a\u306e\u30b3\u30c4','\u7206\u767a\u30d6\u30ec\u30a4\u30af\u5927'],
    ['\u6c37\u7d50','\u6c37\u7d50\u306e\u30b3\u30c4','\u6c37\u7d50\u30d6\u30ec\u30a4\u30af\u5927'],
    ['\u96fb\u6483','\u96fb\u6483\u306e\u30b3\u30c4','\u96fb\u6483\u30d6\u30ec\u30a4\u30af\u5927'],
    ['\u5149','\u5149\u306e\u30b3\u30c4','\u5149\u30d6\u30ec\u30a4\u30af\u5927'],
    ['\u95c7','\u95c7\u306e\u30b3\u30c4','\u95c7\u30d6\u30ec\u30a4\u30af\u5927']
  ];

  for(const [label,co,br] of elements){
    if(traits.includes(co)||traits.includes(br)){
      if(wisdom>attack){
        return {
          role:label+'\u546a\u6587',
          skills:[label+'\u306e\u6975\u610f','\u304b\u3057\u3053\u3055\u30a2\u30c3\u30d74','MP\u30a2\u30c3\u30d74'],
          reason:`${label}\u9069\u6027\u3068\u9ad8\u3081\u306e\u304b\u3057\u3053\u3055\u3092\u6d3b\u304b\u3059`
        };
      }

      return {
        role:label+'\u7269\u7406',
        skills:['\u3051\u3093\u3054\u3046SP','\u653b\u6483\u529b\u30a2\u30c3\u30d74','HP\u30a2\u30c3\u30d74'],
        reason:`${label}\u9069\u6027\u3068\u653b\u6483\u529b\u3092\u6d3b\u304b\u3059`
      };
    }
  }

  if(wisdom>attack*1.08){
    return {
      role:'\u546a\u6587',
      skills:['\u30b0\u30e9\u30f3\u30b9\u30da\u30ebSP','\u304b\u3057\u3053\u3055\u30a2\u30c3\u30d74','MP\u30a2\u30c3\u30d74'],
      reason:'\u9ad8\u3044\u304b\u3057\u3053\u3055\u3092\u6d3b\u304b\u3059'
    };
  }

  const primary=(monster.talents||[]).find(x=>x.primary)?.name;
  if(primary && !['\u3051\u3093\u3054\u3046SP','\u30b0\u30e9\u30f3\u30b9\u30da\u30ebSP'].includes(primary)){
    return {
      role:'\u4e07\u80fd',
      skills:[primary,'\u653b\u6483\u529b\u30a2\u30c3\u30d74','HP\u30a2\u30c3\u30d74'],
      reason:'\u56fa\u6709\u30b9\u30ad\u30eb\u3092\u8ef8\u306b\u4e3b\u80fd\u529b\u3068\u8010\u4e45\u3092\u88dc\u3046'
    };
  }

  return {
    role:'\u7269\u7406',
    skills:['\u3051\u3093\u3054\u3046SP','\u653b\u6483\u529b\u30a2\u30c3\u30d74','HP\u30a2\u30c3\u30d74'],
    reason:'\u9ad8\u3044\u653b\u6483\u529b\u3092\u6d3b\u304b\u3059'
  };
}

function monsterRecommendationHtml(monster){
  const rec=monsterRecommendation(monster);
  if(!rec) return '';

  return `
    <div class="monster-recommendation">
      <div class="recommend-role">
        <span class="badge">\u5f79\u5272</span>
        <strong>${esc(rec.role)}</strong>
      </div>

      <div class="recommend-skill-list">
        ${(rec.skills||[]).map((name,index)=>`
          <div class="recommend-skill-item">
            <span class="recommend-skill-label">
              \u30b9\u30ad\u30eb${index+1}
            </span>
            ${skillButton(name)}
          </div>
        `).join('')}
      </div>

      <div class="recommend-reason">
        <strong>\u7406\u7531\uff1a</strong>
        ${esc(rec.reason||'')}
      </div>

      <div class="small">
        S\u30b5\u30a4\u30ba\u57fa\u6e96\u3002\u5bfe\u4eba\u6226\u30fb\u7279\u5b9a\u30dc\u30b9\u30fbL\u30b5\u30a4\u30ba\u3067\u306f\u8abf\u6574\u304c\u5fc5\u8981\u3067\u3059\u3002
      </div>
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
        <div class="monster-card-title">
          <label
            class="monster-acquired"
            title="入手済み"
          >
            <input
              type="checkbox"
              data-acquired-name="${esc(m.name)}"
              ${acquiredMonsters.has(m.name)?'checked':''}
              onchange='toggleMonsterAcquired(
                ${JSON.stringify(m.name)},
                this.checked
              )'
            >
            <span>入手済み</span>
          </label>

          <div class="name">
            <a
              target="_blank"
              rel="noopener"
              href="${imgUrl(m.name)}"
            >
              ${esc(m.name)}
            </a>
          </div>
        </div>

        <div class="monster-card-actions">
          <button
            class="plan-jump-button"
            type="button"
            onclick='jumpToPlan(${JSON.stringify(m.name)})'
            aria-label="${esc(m.name)}の配合計画を開く"
          >
            🧬 配合計画
          </button>

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

        <h2>\ud83c\udfaf \u304a\u3059\u3059\u3081\u30b9\u30ad\u30eb</h2>
        ${monsterRecommendationHtml(m)}

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
  else if(
    [
      'hp',
      'mp',
      'attack',
      'defence',
      'agility',
      'wisdom'
    ].includes(sortSelect.value)
  ){
    const key=sortSelect.value;
    const av=Number(a.stats?.[key]||0);
    const bv=Number(b.stats?.[key]||0);
    result=av-bv;
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

