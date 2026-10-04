let DB={monsters:[]};

const q=document.getElementById('q');
const results=document.getElementById('results');
const statusEl=document.getElementById('status');
const net=document.getElementById('net');


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
  return 'https://www.google.com/search?tbm=isch&q='
    + encodeURIComponent('DQM3 '+name);
}


function jump(name){
  q.value=name;
  render();

  scrollTo({
    top:0,
    behavior:'smooth'
  });
}

window.jump=jump;


function jbtn(name){
  return `
    <button
      class="jump"
      onclick='jump(${JSON.stringify(name)})'
    >
      ${esc(name)}
    </button>
  `;
}


function recipeText(r){

  const parents=(r.parents||[])
    .map(jbtn)
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
    .map(jbtn)
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

      ${jbtn(u.result)}

    </div>
  `;
}


function card(m){

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


function render(){

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


  /*
   * 検索結果の並び替え
   *
   * 1. 名前完全一致
   * 2. 名前前方一致
   * 3. 名前に部分一致
   * 4. その他
   *
   * 同条件なら図鑑番号順
   */
  found.sort((a,b)=>{

    if(!term){
      return (a.no??9999)-(b.no??9999);
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
      ? found.map(card).join('')
      : '<div class="empty">該当するモンスターがありません。</div>';
}


q.addEventListener(
  'input',
  render
);


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


fetch(
  './data.json?v=5',
  {
    cache:'no-store'
  }
)
.then(r=>{

  if(!r.ok){
    throw new Error();
  }

  return r.json();
})
.then(d=>{

  DB=d;

  render();
})
.catch(()=>{

  statusEl.textContent=
    'データ読み込みエラー';

  results.innerHTML=
    '<div class="empty">GitHub Actionsのデータ更新が完了しているか確認してください。</div>';
});


if('serviceWorker' in navigator){

  navigator.serviceWorker
    .register('./sw.js?v=5')
    .catch(()=>{});
}
