function fmt(n){ return Number(n||0).toLocaleString(undefined,{maximumFractionDigits:n>100?0:2}); }
export function renderPrices(prices){
  const root = document.getElementById('prices');
  root.innerHTML = prices.map(p => `
    <div class="price-row">
      <div class="sym">${p.symbol}</div>
      <div><div class="name">${p.name}</div><div class="src">${p.status} · ${p.source}</div></div>
      <div class="val"><div>$${fmt(p.price)}</div><div class="chg">${p.changePct>=0?'+':''}${Number(p.changePct||0).toFixed(2)}%</div></div>
    </div>
  `).join('');
  const ticker = document.getElementById('ticker');
  ticker.textContent = prices.slice(0,12).map(p => `${p.symbol} $${fmt(p.price)} ${p.changePct>=0?'▲':'▼'}${Math.abs(p.changePct||0).toFixed(2)}%`).join('   |   ');
}
