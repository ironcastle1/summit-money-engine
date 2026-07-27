function fmt(n){ return Number(n||0).toLocaleString(undefined,{maximumFractionDigits:n>100?0:2}); }
function age(ts){ if(!ts) return 'not updated'; const s=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/1000)); return s<60?`${s}s ago`:`${Math.round(s/60)}m ago`; }
export function renderPrices(prices){
  const root = document.getElementById('prices');
  root.innerHTML = prices.map(p => `
    <div class="price-row ${p.status === 'FALLBACK' ? 'fallback' : ''}">
      <div class="sym">${p.symbol}</div>
      <div><div class="name">${p.name}</div><div class="src">${p.status} · ${p.source} · ${age(p.updatedAt)}</div></div>
      <div class="val"><div>$${fmt(p.price)}</div><div class="chg ${p.changePct < 0 ? 'neg' : ''}">${p.changePct>=0?'+':''}${Number(p.changePct||0).toFixed(2)}%</div></div>
    </div>
  `).join('');
  const ticker = document.getElementById('ticker');
  ticker.textContent = prices.slice(0,16).map(p => `${p.symbol} $${fmt(p.price)} ${p.changePct>=0?'▲':'▼'}${Math.abs(p.changePct||0).toFixed(2)}%`).join('   |   ');
}
