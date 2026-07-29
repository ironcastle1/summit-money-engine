import { escapeHtml } from '../ui/dom.js';

function points(values, width, height, padding) {
  const maximum = Math.max(1, ...values);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  return values.map((value, index) => {
    const x = padding + (values.length <= 1 ? usableWidth / 2 : index / (values.length - 1) * usableWidth);
    const y = padding + usableHeight - value / maximum * usableHeight;
    return [x, y];
  });
}

function linePath(values, width, height, padding) {
  return points(values, width, height, padding).map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

function areaPath(values, width, height, padding) {
  const coordinates = points(values, width, height, padding);
  if (!coordinates.length) return '';
  const baseline = height - padding;
  return `M${coordinates[0][0].toFixed(1)} ${baseline} ${coordinates.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')} L${coordinates.at(-1)[0].toFixed(1)} ${baseline} Z`;
}

export function renderTimelineChart(container, timeline) {
  const buckets = timeline?.buckets || [];
  if (!container || !buckets.length) {
    if (container) container.innerHTML = '<div class="news-empty">0 DATA</div>';
    return;
  }
  const width = 900;
  const height = 220;
  const padding = 24;
  const all = buckets.map(bucket => bucket.count);
  const news = buckets.map(bucket => bucket.news);
  const social = buckets.map(bucket => bucket.social);
  const maximum = Math.max(1, ...all);
  const grid = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
    const y = padding + (height - padding * 2) * (1 - ratio);
    return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}"/><text x="2" y="${y + 4}">${Math.round(maximum * ratio)}</text>`;
  }).join('');
  const labels = buckets.map((bucket, index) => {
    if (index % Math.max(1, Math.floor(buckets.length / 6)) !== 0 && index !== buckets.length - 1) return '';
    const x = padding + (buckets.length <= 1 ? 0 : index / (buckets.length - 1) * (width - padding * 2));
    const date = new Date(bucket.end);
    return `<text x="${x}" y="${height - 4}" text-anchor="middle">${escapeHtml(date.toISOString().slice(11, 16))}</text>`;
  }).join('');
  container.innerHTML = `<svg class="news-timeline-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Article volume timeline">
    <g class="news-chart-grid">${grid}</g>
    <path class="news-chart-area" d="${areaPath(all, width, height, padding)}"/>
    <path class="news-chart-line all" d="${linePath(all, width, height, padding)}"/>
    <path class="news-chart-line editorial" d="${linePath(news, width, height, padding)}"/>
    <path class="news-chart-line social" d="${linePath(social, width, height, padding)}"/>
    <g class="news-chart-labels">${labels}</g>
  </svg>`;
}
