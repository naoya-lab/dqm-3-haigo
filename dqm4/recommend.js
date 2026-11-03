function renderRecommendations(){
  const teams=RECOMMEND_DB.teams.filter(team=>
    team.target===recommendTarget.value && team.strategy===recommendStrategy.value);
  statusEl.textContent=teams.length?`登録済み編成：${teams.length}件`:'おすすめ編成は確認待ち';
  results.innerHTML=teams.length?teams.map(team=>`
    <section class="card">
      <div class="skillname">${esc(team.title)}</div>
      <div class="rec-reason">${esc(team.reason)}</div>
      ${(team.members||[]).map(member=>`
        <div class="route">${monsterButton(member.name)} · ${esc(member.role)}
          <div>${(member.skills||[]).map(skillButton).join(' ／ ')}</div>
          <div class="small">${esc(member.reason)}</div>
        </div>`).join('')}
      ${sourceLink(team.sourceUrl)}
    </section>`).join(''):
    '<div class="empty">このテーマ・方針の編成は未登録です。モンスターズ4で確認できた特性・スキルをもとに追加します。</div>';
}
