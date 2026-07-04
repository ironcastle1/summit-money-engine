import { apiGet } from '../services/api.js';
const charts = {};
function labels(points){ return points.map((_, i) => i); }
function values(points){ return points.map(p => Number(p.c)); }
function buildChart(canvasId, label, points){
  const ctx = document.getElementById(canvasId);
  if (!ctx || !window.Chart) return;
  if (charts[canvasId]) charts[canvasId].destroy();
  charts[canvasId] = new Chart(ctx, {
    type:'line',
    data:{ labels: labels(points), datasets:[{ label, data: values(points), borderColor:'#00d9ff', backgroundColor:'rgba(0,217,255,.12)', tension:.22, pointRadius:0, borderWidth:2, fill:true }] },
    options:{ animation:false, responsive:true, maintainAspectRatio:false, scales:{ x:{ display:false }, y:{ ticks:{ color:'#8eb8c7', maxTicksLimit:5 }, grid:{ color:'rgba(255,255,255,.08)' } } }, plugins:{ legend:{ display:false } } }
  });
}
export async function loadCharts(){
  const map = { BTC:'chartBTC', ETH:'chartETH', VRT:'chartVRT', COPPER:'chartCOPPER' };
  for (const [sym, id] of Object.entries(map)) {
    try { const data = await apiGet(`/api/chart/${sym}`); buildChart(id, sym, data.points || []); } catch(e) { console.warn('chart failed', sym, e.message); }
  }
}
