export function renderSignals(signals){
  const root = document.getElementById('signals');
  root.innerHTML = signals.map(s => `
    <article class="signal-card ${s.status === 'ACTIONABLE WATCH' ? 'hot' : ''}">
      <div class="meta">${s.status} · score ${s.score} · ${s.risk} risk</div>
      <h3>${s.title}</h3>
      <p class="play">${s.action}</p>
      <p class="detail"><strong>Assets:</strong> ${s.assets.join(', ')}</p>
      <p class="detail"><strong>Trigger:</strong> ${s.trigger}</p>
      <p class="detail"><strong>Confirming now:</strong> ${s.confirmingAssets?.length ? s.confirmingAssets.join(', ') : 'none yet'}</p>
      <ul>${s.verify.map(v => `<li>${v}</li>`).join('')}</ul>
    </article>
  `).join('');
  document.getElementById('bottomTicker').textContent = signals.map(s => `${s.title.toUpperCase()} — ${s.status} — verify: ${s.verify[0]}`).join('   ///   ');
}
export function renderPolymarket(markets){
  const root = document.getElementById('polymarketPanel');
  root.innerHTML = '<h3 class="poly-title">Polymarket event pulse</h3>' + markets.slice(0,10).map(m => `
    <a class="poly-row" href="${m.url}" target="_blank" rel="noreferrer">
      <h4>${m.question}</h4>
      <p>Volume $${Math.round(m.volume).toLocaleString()} · Liquidity $${Math.round(m.liquidity).toLocaleString()} · score ${m.score}</p>
    </a>
  `).join('');
}
