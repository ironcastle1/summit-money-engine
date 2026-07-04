let rapidChart;
function chart(move){
  const ctx = document.getElementById('rapidChart');
  if (!ctx || !window.Chart || !move) return;
  rapidChart?.destroy();
  const labels = move.series.map(p=>`+${p.t*15}m`);
  rapidChart = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[
      { label:`${move.symbol} projected path`, data: move.series.map(p=>p.price), borderWidth:2, tension:.32, pointRadius:0 },
      { label:'upper range', data:(move.upper||[]).map(p=>p.price), borderWidth:1, borderDash:[4,4], pointRadius:0 },
      { label:'lower range', data:(move.lower||[]).map(p=>p.price), borderWidth:1, borderDash:[4,4], pointRadius:0 }
    ] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#dff7ff', boxWidth:10 } } }, scales:{ x:{ ticks:{ color:'#8fb6c9' }, grid:{ color:'rgba(21,83,122,.25)' } }, y:{ ticks:{ color:'#8fb6c9' }, grid:{ color:'rgba(21,83,122,.25)' } } } }
  });
  const meta = document.getElementById('rapidMeta');
  if (meta) meta.innerHTML = `<h3>${move.symbol}: ${move.probability.keepRising}% continuation / ${move.probability.drop}% drop-risk</h3><p>${move.verdict}</p><b>Why it appears:</b><ul>${(move.reasons||[]).map(r=>`<li>${r}</li>`).join('')}</ul><b>Verify before using:</b><ul>${(move.verify||[]).map(r=>`<li>${r}</li>`).join('')}</ul><div class="rapid-sources">Sources: ${(move.sources||[]).join(' · ')}</div>`;
}
export function renderRapid(moves=[]){
  const el = document.getElementById('rapidList');
  if (!el) return;
  if (!moves.length) { el.innerHTML = '<div class="rapid-item">No rapid movers on current refresh.</div>'; chart(null); return; }
  el.innerHTML = moves.map((m,i)=>`<div class="rapid-item ${i===0?'active':''}" data-i="${i}"><strong>${m.symbol}</strong> ${Number(m.changePct||0).toFixed(2)}%<br><span class="p">${m.probability.keepRising}% continuation</span><div class="rapid-reasons">${(m.reasons||[]).slice(0,2).join(' ')}</div><small>${(m.sources||[]).join(' · ')}</small></div>`).join('');
  el.querySelectorAll('.rapid-item').forEach(card => card.addEventListener('click', () => { el.querySelectorAll('.rapid-item').forEach(x=>x.classList.remove('active')); card.classList.add('active'); chart(moves[Number(card.dataset.i)]); }));
  chart(moves[0]);
}
