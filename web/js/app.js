import { apiGet, apiPost } from './services/api.js';
import { setupPanels } from './components/panels.js';
import { renderPrices } from './components/prices.js';
import { renderSignals, renderPolymarket } from './components/signals.js';
import { initMap, setFilter } from './components/map.js';
import { loadCharts } from './components/charts.js';
import { setState } from './state/store.js';

async function loadState(){
  const data = await apiGet('/api/state');
  setState({ data });
  document.getElementById('statusText').textContent = `${data.engine.status} · ${data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString() : 'not updated'}`;
  renderPrices(data.prices || []);
  renderSignals(data.signals || []);
  renderPolymarket(data.predictionMarkets || []);
}

async function refresh(){
  document.getElementById('statusText').textContent = 'refreshing...';
  const data = await apiPost('/api/refresh');
  setState({ data });
  renderPrices(data.prices || []);
  renderSignals(data.signals || []);
  renderPolymarket(data.predictionMarkets || []);
  await loadCharts();
}

function bind(){
  setupPanels();
  document.querySelectorAll('.filter[data-filter]').forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));
  document.getElementById('refreshBtn').addEventListener('click', refresh);
}

bind();
await initMap();
await loadState();
await loadCharts();
setInterval(loadState, 45_000);
