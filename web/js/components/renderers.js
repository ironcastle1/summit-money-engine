window.Renderers = (() => {
  const money = n => Number.isFinite(Number(n)) ? '$' + Number(n).toLocaleString(undefined,{maximumFractionDigits:Number(n)<10?4:2}) : '—';
  const pct = n => `<span class="${Number(n)>=0?'hot':'bad'}">${Number(n)>=0?'+':''}${Number(n||0).toFixed(2)}%</span>`;
  function renderTicker(markets){
    const row = (markets||[]).slice(0,12).map(m => `${m.id} ${money(m.price)} ${Number(m.changePct)>=0?'▲':'▼'}${Math.abs(Number(m.changePct||0)).toFixed(2)}%`).join('  |  ');
    document.getElementById('ticker').textContent = row || 'No market data';
    document.getElementById('marquee').textContent = row + ' /// ' + row;
  }
  function renderMarkets(markets){
    const el=document.getElementById('markets');
    el.innerHTML=(markets||[]).map(m=>`<div class="market-row"><div class="asset">${m.id}</div><div><b>${m.label}</b><div class="source">${m.source} · ${m.status} ${m.ageSec?`· ${m.ageSec}s old`:''}</div></div><div class="price"><b>${money(m.price)}</b><br>${pct(m.changePct)}</div></div>`).join('') || '<div class="sub">No market data yet.</div>';
  }
  function renderPolymarket(items){
    const el=document.getElementById('poly');
    el.innerHTML=(items||[]).slice(0,10).map(p=>`<div class="poly-card"><b>${p.question}</b><p>Volume: ${Math.round(p.volume||0).toLocaleString()} · Liquidity: ${Math.round(p.liquidity||0).toLocaleString()}</p><a target="_blank" href="${p.url}">open source</a></div>`).join('') || '<div class="sub">No Polymarket data yet.</div>';
  }
  function renderSignals(items){
    const el=document.getElementById('signals');
    el.innerHTML=(items||[]).map(s=>`<div class="signal-card"><h4>${s.title}</h4><p><span class="score">Score ${Math.round(s.score)}</span> · ${s.status} · ${s.source}</p><p>${s.why}</p><p><b>Watch:</b> ${s.watch}</p><p><b>Checks:</b> ${(s.checks||[]).join(' · ')}</p>${s.url&&s.url!=='#'?`<a target="_blank" href="${s.url}">source</a>`:''}</div>`).join('') || '<div class="sub">No signals yet.</div>';
  }
  function renderRapid(items){
    const el=document.getElementById('rapid');
    el.innerHTML=(items||[]).map((r,i)=>`<div class="rapid-card"><h4>${r.asset} · ${r.label}</h4><p><b>Move:</b> ${r.move15}% short window · ${r.moveDay}% session · rank ${r.rank}</p><p><b>Estimate:</b> continuation ${r.continuation}% · drop/reversal ${r.drop}%</p><p><b>Reasons:</b> ${(r.reasons||[]).join(' · ')}</p><p><b>Checks:</b> ${(r.checks||[]).join(' · ')}</p><div class="chart-box"><canvas id="rapidChart${i}"></canvas></div></div>`).join('') || '<div class="sub">No rapid movers yet.</div>';
    setTimeout(()=>items?.forEach((r,i)=>window.Charts?.line(`rapidChart${i}`, r.projection||[], r.asset)),50);
  }
  function renderContext(data){
    if(!data) return;
    document.getElementById('contextTitle').textContent = data.country?.name || 'AREA';
    document.getElementById('contextBody').innerHTML = `<div class="ctx-card"><p>${data.country?.summary||'No summary.'}</p><p><b>Watch:</b> ${(data.country?.watches||[]).join(', ')}</p></div><h3>Nearby events</h3>${(data.nearEvents||[]).slice(0,8).map(e=>`<div class="ctx-card"><b>${e.title}</b><p>${e.source} · ${e.place}</p></div>`).join('')}<h3>Nearby market nodes</h3>${(data.nearNodes||[]).slice(0,6).map(n=>`<div class="ctx-card"><b>${n.name}</b><p>${n.note}</p><p>Watch: ${(n.watch||[]).join(', ')}</p></div>`).join('')}`;
    Panels.open('context');
  }
  return { renderTicker, renderMarkets, renderPolymarket, renderSignals, renderRapid, renderContext };
})();
