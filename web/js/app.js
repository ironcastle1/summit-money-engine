import { apiGet, apiPost } from './services/api.js';
import { setupPanels } from './components/panels.js';
import { renderPrices } from './components/prices.js';
import { renderSignals, renderPolymarket } from './components/signals.js';
import { initMap, setFilter, reloadMapData, setRouteMode } from './components/map.js';
import { loadCharts } from './components/charts.js';
import { renderRapid } from './components/rapid.js';
import { setState } from './state/store.js';

function ticker(data){
  const rows = (data.prices || []).slice(0, 12).map(p => `${p.symbol} $${Number(p.price||0).toLocaleString(undefined,{maximumFractionDigits:p.price>100?0:2})} ${Number(p.changePct||0)>=0?'▲':'▼'}${Math.abs(Number(p.changePct||0)).toFixed(2)}%`);
  document.getElementById('ticker').textContent = rows.join('   |   ') || 'No market data';
  document.getElementById('bottomTicker').textContent = (data.signals || []).slice(0, 8).map(s => `${s.title}: ${s.status} · watch ${s.assets.join('/')}`).join('   ///   ') || 'No signals';
}
function applyState(data){
  setState({ data });
  document.getElementById('statusText').textContent = `${data.engine.status} · ${data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString() : 'not updated'} · refresh #${data.refreshCount || 0}`;
  renderPrices(data.prices || []);
  renderSignals(data.signals || []);
  renderPolymarket(data.predictionMarkets || []);
  renderRapid(data.rapidMoves || []);
  ticker(data);
  reloadMapData(true);
}
async function loadState(){
  const data = await apiGet('/api/state');
  applyState(data);
}
async function refresh(){
  document.getElementById('liveStatus').textContent = 'REFRESHING';
  const data = await apiPost('/api/refresh');
  applyState(data);
  await loadCharts();
  document.getElementById('liveStatus').textContent = 'LIVE';
}
function bind(){
  setupPanels();
  document.querySelectorAll('.filter[data-filter]').forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));
  document.getElementById('refreshBtn').addEventListener('click', refresh);
  document.getElementById('shippingRoutes').addEventListener('click', e => { e.currentTarget.classList.toggle('active'); setRouteMode('shipping', e.currentTarget.classList.contains('active')); });
  document.getElementById('landRoutes').addEventListener('click', e => { e.currentTarget.classList.toggle('active'); setRouteMode('land', e.currentTarget.classList.contains('active')); });
}
function connectStream(){
  if (!window.EventSource) return;
  const es = new EventSource('/api/stream');
  es.addEventListener('state', ev => {
    try { applyState(JSON.parse(ev.data)); } catch {}
  });
  es.onerror = () => console.warn('stream reconnecting');
}
bind();
await initMap();
window.addEventListener('resize', () => { const map = document.querySelector('#map')?._leaflet_map; });
await loadState();
await loadCharts();
connectStream();
setInterval(refresh, 45_000);
setInterval(loadCharts, 90_000);
