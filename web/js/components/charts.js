import { apiGet } from '../services/api.js';
const charts = {};
function simpleSeries(points){ return points.map(p => ({ x:new Date(p.t), y:p.c || p.c === 0 ? p.c : p.c })); }
function buildChart(canvasId, label, points){
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (charts[canvasId]) charts[canvasId].destroy();
  charts[canvasId] = new Chart(ctx, {
    type:'line',
    data:{ datasets:[{ label, data:simpleSeries(points), borderColor:'#00d9ff', backgroundColor:'rgba(0,217,255,.12)', tension:.25, pointRadius:0, borderWidth:2 }] },
    options:{ animation:false, responsive:true, maintainAspectRatio:false, parsing:false, scales:{ x:{ display:false }, y:{ ticks:{ color:'#7aa6b6' }, grid:{ color:'rgba(255,255,255,.08)' } } }, plugins:{ legend:{ display:false } } }
  });
}
export async function loadCharts(){
  const map = { BTC:'chartBTC', ETH:'chartETH', VRT:'chartVRT', COPPER:'chartCOPPER' };
  for (const [sym, id] of Object.entries(map)) {
    try { const data = await apiGet(`/api/chart/${sym}`); buildChart(id, sym, data.points || []); } catch(e) { console.warn('chart failed', sym, e.message); }
  }
}
