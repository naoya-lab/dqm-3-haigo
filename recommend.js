// Classic scripts share the existing global scope; see DEVELOPING.md for load order.
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

