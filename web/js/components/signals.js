export function renderSignals(signals){
  const root = document.getElementById('signals');
  root.innerHTML = signals.map(s => `
    <article class="signal-card">
      <div class="meta">${s.status} · score ${s.score} · risk ${s.risk}</div>
      <h3>${s.title}</h3>
      <p class="play">${s.action}</p>
      <p class="detail"><strong>Assets:</strong> ${s.assets.join(', ')}</p>
      <p class="detail"><strong>Capital route:</strong> ${s.capital}</p>
      <p class="detail"><strong>Trigger:</strong> ${s.trigger}</p>
      <ul>${s.verify.map(v => `<li>${v}</li>`).join('')}</ul>
    </article>
  `).join('');
  document.getElementById('bottomTicker').textContent = signals.map(s => `${s.title.toUpperCase()} — ${s.status} — verify: ${s.verify[0]}`).join('   ///   ');
}
export function renderPolymarket(markets){
  const root = document.getElementById('polymarketPanel');
  root.innerHTML = '<h3 style="padding:0 0 6px;color:#00d9ff;letter-spacing:.2em;text-transform:uppercase">Event Markets</h3>' + markets.slice(0,8).map(m => `
    <div class="poly-row"><h4>${m.question}</h4><p>Volume $${Math.round(m.volume).toLocaleString()} · Liquidity $${Math.round(m.liquidity).toLocaleString()}</p></div>
  `).join('');
}
