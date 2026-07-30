import { escapeHtml } from '../ui/dom.js';

function points(values, width, height, padding, accessor) {
  const data = values.map(accessor).filter(Number.isFinite);
  if (!data.length) return '';
  const minimum = Math.min(...data);
  const maximum = Math.max(...data);
  const range = maximum - minimum || 1;
  return values.map((value, index) => {
    const numeric = accessor(value);
    const x = padding + index / Math.max(1, values.length - 1) * (width - padding * 2);
    const y = padding + (maximum - numeric) / range * (height - padding * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

export function renderEquityChart(root, equity = []) {
  if (!root) return;
  if (!equity.length) { root.innerHTML = '<div class="chart-empty">NO EQUITY SERIES</div>'; return; }
  const width = 900;
  const height = 300;
  const padding = 28;
  const equityPoints = points(equity, width, height, padding, item => Number(item[1]));
  const drawdownPoints = points(equity, width, height, padding, item => Number(item[2]));
  const start = Number(equity[0]?.[1]);
  const end = Number(equity.at(-1)?.[1]);
  root.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Equity curve">
    <defs><linearGradient id="equity-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".28"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
    <g class="chart-grid"><line x1="${padding}" x2="${width-padding}" y1="${padding}" y2="${padding}"/><line x1="${padding}" x2="${width-padding}" y1="${height/2}" y2="${height/2}"/><line x1="${padding}" x2="${width-padding}" y1="${height-padding}" y2="${height-padding}"/></g>
    <polyline class="drawdown-line" points="${escapeHtml(drawdownPoints)}" fill="none"/>
    <polyline class="equity-line" points="${escapeHtml(equityPoints)}" fill="none"/>
    <text x="${padding}" y="18">${Number.isFinite(start) ? start.toFixed(0) : 'N/A'}</text><text x="${width-padding}" y="18" text-anchor="end">${Number.isFinite(end) ? end.toFixed(0) : 'N/A'}</text>
  </svg>`;
}
