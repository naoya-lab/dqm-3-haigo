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
        生息地情報は未登録
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
        卵からの入手情報は未登録
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
        未登録・確認待ち
      </div>
    `;
  }

  return traits.map(trait=>`
    <div class="trait-row">
      <span class="trait-level">
        ${trait.level==null?'習得Lv未確認':'Lv'+esc(trait.level)}
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
      ${r.note?`<div class="small">条件：${esc(r.note)}</div>`:''}
      ${sourceLink(r.sourceUrl)}
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
      ${u.note?`<div class="small">条件：${esc(u.note)}</div>`:''}
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
      \u2605\u306f登録済みデータ\u306e\u6700\u5927\u5024\u5206\u5e03\u30925\u6bb5\u968e\u306b\u5206\u3051\u305f\u76f8\u5bfe\u8a55\u4fa1\u3067\u3059\u3002
    </div>
  `;
}

function monsterRecommendationHtml(){return '<div class="small">DQM4のおすすめスキルは確認待ちです。</div>'; }

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

  const cardId=`monster-${DB.monsters.indexOf(m)}`;

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
          <span class="badge">${m.dataStatus==='announced'?'登場確認・詳細待ち':'詳細データあり'}</span>
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

  const acquiredFilter=document.getElementById('acquiredFilter').value;
  const acquired=acquiredMonsters.has(monster.name);
  const acquiredOk=acquiredFilter==='all'
    ||(acquiredFilter==='acquired' && acquired)
    ||(acquiredFilter==='missing' && !acquired);

  return rankOk && familyOk && acquiredOk;
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
    const aMissing=!(Number(a.stats?.[key])>0),bMissing=!(Number(b.stats?.[key])>0);
    if(aMissing!==bMissing)return aMissing?1:-1;
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
    ||selectedFilterValues(familyFilters).length
    ||document.getElementById('acquiredFilter').value!=='all';

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
