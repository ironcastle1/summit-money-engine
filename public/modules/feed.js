import { esc, ago } from './utils.js';

export function renderFeed(container, events, onSelect) {
  if (!events.length) {
    container.innerHTML = '<div class="empty"><b>No current event passes this filter.</b><span>Lower the score threshold, widen the time window, or check the source status.</span></div>';
    return;
  }
  container.innerHTML = events.map(card).join('');
  container.querySelectorAll('[data-event]').forEach(el => {
    el.addEventListener('click', () => onSelect(events.find(item => item.id === el.dataset.event)));
  });
}

function card(item) {
  const source = item.evidence?.[0]?.sourceName || item.evidence?.[0]?.sourceDomain || 'Source';
  const summary = item.whyItMatters || item.summary || '';
  return `<button class="event-card urgency-${esc(String(item.urgency || 'watch').toLowerCase())}" data-event="${esc(item.id)}">
    <div class="card-top">
      <span class="score">${item.signalScore}</span>
      <span class="urgency">${esc(item.urgency)}</span>
      <span class="category">${esc(item.category)}</span>
      <time>${ago(item.publishedAt)}</time>
    </div>
    <h3>${esc(item.title)}</h3>
    <p>${esc(summary)}</p>
    <div class="card-meta">
      <span>${esc(item.location?.name || 'Regional / global')}</span>
      <span>${item.independentSources} source${item.independentSources === 1 ? '' : 's'}</span>
      <span>${item.confidence}% confidence</span>
      <span>${esc(source)}</span>
    </div>
  </button>`;
}
