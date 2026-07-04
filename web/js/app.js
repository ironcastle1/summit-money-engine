import { apiGet, apiPost } from './services/api.js';
import { setupPanels } from './components/panels.js';
import { renderPrices } from './components/prices.js';
import { renderSignals, renderPolymarket } from './components/signals.js';
import { initMap, setFilter } from './components/map.js';
import { loadCharts } from './components/charts.js';
import { setState } from './state/store.js';

function applyState(data){
  setState({ data });
  document.getElementById('statusText').textContent = `${data.engine.status} · ${data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString() : 'not updated'} · refresh #${data.refreshCount || 0}`;
  renderPrices(data.prices || []);
  renderSignals(data.signals || []);
  renderPolymarket(data.predictionMarkets || []);
}

async function loadState(){
  const data = await apiGet('/api/state');
  applyState(data);
}

async function refresh(){
  document.getElementById('statusText').textContent = 'refreshing live feeds...';
  const data = await apiPost('/api/refresh');
  applyState(data);
  await loadCharts();
}

function bind(){
  setupPanels();
  document.querySelectorAll('.filter[data-filter]').forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));
  document.getElementById('refreshBtn').addEventListener('click', refresh);
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
await loadState();
await loadCharts();
connectStream();
setInterval(refresh, 60_000);
setInterval(loadCharts, 90_000);
