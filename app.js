
let DB={monsters:[]};
const q=document.getElementById('q');
const results=document.getElementById('results');
const statusEl=document.getElementById('status');
const net=document.getElementById('net');

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function norm(s){return String(s??'').toLowerCase().replace(/[\s・･ー]/g,'');}
function imgUrl(name){return 'https://www.google.com/search?tbm=isch&q='+encodeURIComponent('DQM3 '+name);}
function jump(name){q.value=name;render();scrollTo({top:0,behavior:'smooth'});}
window.jump=jump;
function jbtn(name){return `<button class="jump" onclick='jump(${JSON.stringify(name)})'>${esc(name)}</button>`;}

function recipeText(r){
  let parents=(r.parents||[]).map(jbtn).join(' ＋ ');
  return `<div class="route"><span class="rtype">${esc(r.type||'配合')}</span>${parents} <span class="arrow">→</span> ${esc(r.result||'')}</div>`;
}
function useText(u){
  let other=(u.otherParents||[]).map(jbtn).join(' ＋ ');
  return `<div class="route"><span class="rtype">${esc(u.type||'配合')}</span>${esc(u.source||'')} ${other?`＋ ${other}`:''} <span class="arrow">→</span> ${jbtn(u.result)}</div>`;
}
function card(m){
  let recipes=(m.recipes||[]).map(recipeText).join('')||'<div class="small">配合での入手なし／未登録</div>';
  let uses=(m.uses||[]).map(useText).join('')||'<div class="small">特殊な配合先なし／未登録</div>';
  return `<section class="card">
    <div class="name"><a target="_blank" rel="noopener" href="${imgUrl(m.name)}">${esc(m.name)}</a></div>
    <div class="meta">
      ${m.no?`<span class="badge">No.${esc(m.no)}</span>`:''}
      ${m.rank?`<span class="badge">${esc(m.rank)}ランク</span>`:''}
      ${m.family?`<span class="badge">${esc(m.family)}</span>`:''}
    </div>
    <h2>このモンスターの作り方</h2>${recipes}
    <h2>このモンスターを使う配合先</h2>${uses}
  </section>`;
}
function render(){
  const term=norm(q.value);
  const found=DB.monsters.filter(m=>{
    const text=[m.name,m.reading,m.rank,m.family,m.no,
      ...(m.recipes||[]).flatMap(r=>[...(r.parents||[]),r.result]),
      ...(m.uses||[]).flatMap(u=>[...(u.otherParents||[]),u.result])
    ].join(' ');
    return !term||norm(text).includes(term);
  });
  const keyword = searchInput.value.trim().toLowerCase();

const filtered = monsters
  .filter(monster =>
    monster.name.toLowerCase().includes(keyword)
  )
  .sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    // 完全一致を最優先
    if (aName === keyword && bName !== keyword) return -1;
    if (bName === keyword && aName !== keyword) return 1;

    // 次に前方一致
    const aStarts = aName.startsWith(keyword);
    const bStarts = bName.startsWith(keyword);

    if (aStarts && !bStarts) return -1;
    if (bStarts && !aStarts) return 1;

    // 最後に図鑑番号順
    return (a.no ?? 9999) - (b.no ?? 9999);
  });
  statusEl.textContent=term?`検索結果：${found.length}体`:`登録：${DB.monsters.length}体`;
  results.innerHTML=found.length?found.map(card).join(''):'<div class="empty">該当するモンスターがありません。</div>';
}
q.addEventListener('input',render);
function updateNet(){net.textContent=navigator.onLine?'オンライン':'オフライン';}
addEventListener('online',updateNet);addEventListener('offline',updateNet);updateNet();

fetch('./data.json?v=4',{cache:'no-store'})
 .then(r=>{if(!r.ok)throw new Error();return r.json();})
 .then(d=>{DB=d;render();})
 .catch(()=>{statusEl.textContent='データ読み込みエラー';results.innerHTML='<div class="empty">GitHub Actionsのデータ更新が完了しているか確認してください。</div>';});

if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=4').catch(()=>{});
