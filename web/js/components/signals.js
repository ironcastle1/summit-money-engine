export function renderSignals(signals){
  const root = document.getElementById('signals');
  if (!root) return;
  root.innerHTML = signals.map(s => `
    <article class="signal-card ${s.status === 'CONFIRMED WATCH' ? 'hot' : ''}">
      <div class="meta">${s.status} · score ${s.score} · ${s.risk} risk</div>
      <h3>${s.title}</h3>
      <p class="play">${s.action}</p>
      <p class="detail"><strong>Watch:</strong> ${s.assets.join(', ')}</p>
      <p class="detail"><strong>Trigger:</strong> ${s.trigger}</p>
      <p class="detail"><strong>Moving now:</strong> ${s.confirmingAssets?.length ? s.confirmingAssets.join(', ') : 'none yet'}</p>
      <ul>${s.verify.map(v => `<li>${v}</li>`).join('')}</ul>
    </article>
  `).join('') || '<div class="panel-empty">No confirmed signal on this refresh.</div>';
  document.getElementById('bottomTicker').textContent = signals.map(s => `${s.title.toUpperCase()} — ${s.status} — check: ${s.verify[0]}`).join('   ///   ') || 'No signals';
}
export function renderPolymarket(markets){
  const root = document.getElementById('polymarketPanel');
  if (!root) return;
  root.innerHTML = '<h3 class="poly-title">Polymarket event pulse</h3>' + (markets.slice(0,10).map(m => `
    <a class="poly-row" href="${m.url}" target="_blank" rel="noreferrer">
      <h4>${m.question}</h4>
      <p>Volume $${Math.round(m.volume||0).toLocaleString()} · Liquidity $${Math.round(m.liquidity||0).toLocaleString()} · score ${m.score}</p>
    </a>
  `).join('') || '<div class="panel-empty">No event-market data on this refresh.</div>');
}
