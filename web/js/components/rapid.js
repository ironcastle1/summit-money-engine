let rapidChart;
function chart(move){
  const ctx = document.getElementById('rapidChart');
  if (!ctx || !window.Chart || !move) return;
  rapidChart?.destroy();
  rapidChart = new Chart(ctx, {
    type:'line',
    data:{ labels: move.series.map(p=>`+${p.t*15}m`), datasets:[{ label:`${move.symbol} projection`, data: move.series.map(p=>p.price), borderWidth:2, tension:.32 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#dff7ff' } } }, scales:{ x:{ ticks:{ color:'#8fb6c9' }, grid:{ color:'rgba(21,83,122,.3)' } }, y:{ ticks:{ color:'#8fb6c9' }, grid:{ color:'rgba(21,83,122,.3)' } } } }
  });
}
export function renderRapid(moves=[]){
  const el = document.getElementById('rapidList');
  if (!el) return;
  if (!moves.length) { el.innerHTML = '<div class="rapid-item">No rapid movers. Wait.</div>'; return; }
  el.innerHTML = moves.map((m,i)=>`<div class="rapid-item ${i===0?'active':''}" data-i="${i}"><strong>${m.symbol}</strong> ${Number(m.changePct||0).toFixed(2)}%<br><span class="p">${m.probability.keepRising}% continuation</span><br>${m.verdict}<br><small>Verify: ${m.verify[0]}</small></div>`).join('');
  el.querySelectorAll('.rapid-item').forEach(card => card.addEventListener('click', () => { el.querySelectorAll('.rapid-item').forEach(x=>x.classList.remove('active')); card.classList.add('active'); chart(moves[Number(card.dataset.i)]); }));
  chart(moves[0]);
}
