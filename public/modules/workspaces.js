import { esc, ago, fmt } from './utils.js';

export function renderWorkspace(view, snapshot, onSelect, reference = null) {
  const events = snapshot?.signals || [];
  if (view === 'opportunities') return opportunitiesView(events, onSelect);
  if (view === 'markets') return marketsView(events, snapshot?.markets || [], onSelect);
  if (view === 'conflicts') return conflictsView(events, onSelect);
  if (view === 'countries') return countriesView(events, reference || {});
  if (view === 'briefing') return briefingView(snapshot?.briefing || {}, onSelect);
  return '';
}

function opportunitiesView(events, onSelect) {
  const rows = events
    .filter(item => item.market?.rules?.length)
    .map(item => ({ item, score: opportunityScore(item) }))
    .sort((a,b) => b.score - a.score);

  const cards = rows.map(({ item, score }) => {
    const rule = item.market.rules[0];
    const benefits = (item.market.potentialBeneficiaries || []).slice(0,5);
    const pressure = (item.market.potentialLosers || []).slice(0,5);
    const horizon = (item.market.horizons || [rule.horizon]).filter(Boolean).join(' · ');
    return `<button class="opportunity-card" data-id="${esc(item.id)}">
      <div class="opportunity-head"><span class="opportunity-score">${score}</span><span><b>${esc(item.category)}</b><small>setup score</small></span><time>${ago(item.publishedAt)}</time></div>
      <h3>${esc(item.title)}</h3>
      <p>${esc(rule.rationale)}</p>
      <div class="opportunity-columns">
        <div><small>POSSIBLE BENEFICIARIES</small>${chipList(benefits,'positive')}</div>
        <div><small>POSSIBLE PRESSURE</small>${chipList(pressure,'negative')}</div>
      </div>
      <div class="opportunity-foot"><span>Evidence ${esc(item.evidenceGrade)}</span><span>${item.confidence}% confidence</span><span>${esc(horizon || 'unknown horizon')}</span></div>
    </button>`;
  }).join('') || '<div class="empty"><b>No current opportunity clears the filter.</b><span>Merlin only creates an opportunity card when a current event matches a defined market-transmission rule.</span></div>';

  bindEventCards('.opportunity-card[data-id]', rows.map(row => row.item), onSelect);
  return `<section class="workspace-section"><div class="section-intro"><h2>Current opportunities</h2><p>Ranked from current events with a defined market effect. The score measures evidence, event importance and model match; it is not a guaranteed return probability.</p></div><div class="opportunity-list">${cards}</div></section>`;
}

function marketsView(events, markets, onSelect) {
  const ticker = markets.map(row => `<div class="market-tile">
    <b>${esc(row.symbol)}</b><strong>${fmt(row.price)}</strong>
    ${Number.isFinite(row.change24h) ? `<span class="${row.change24h >= 0 ? 'up' : 'down'}">${row.change24h >= 0 ? '+' : ''}${row.change24h.toFixed(1)}%</span>` : ''}
    <small>${esc(row.sourceName || 'market source')}${row.stale ? ' · retained' : ''}</small>
  </div>`).join('');

  const linked = events.filter(item => item.market?.rules?.length);
  const cards = linked.map(item => `<button class="impact-card" data-id="${esc(item.id)}">
    <div><span class="score">${item.signalScore}</span><small>${esc(item.category)}</small></div>
    <h3>${esc(item.title)}</h3>
    <p>${esc(item.market.rules[0].rationale)}</p>
    <div class="chips">${(item.market.assets || []).slice(0,7).map(value => `<span>${esc(value)}</span>`).join('')}</div>
  </button>`).join('') || '<div class="empty">No current event has a strong enough market link.</div>';

  bindEventCards('.impact-card[data-id]', linked, onSelect);
  return `<section class="workspace-section"><h2>Current prices</h2><div class="market-grid">${ticker || '<span class="muted">Market sources have not returned current values.</span>'}</div></section>
    <section class="workspace-section"><h2>Events affecting markets</h2><div class="impact-list">${cards}</div></section>`;
}

function conflictsView(events, onSelect) {
  const conflictEvents = events.filter(item => isConflict(item));
  const rows = conflictEvents.map(item => `<button class="event-row" data-id="${esc(item.id)}">
    <span class="row-score">${item.signalScore}</span>
    <span class="row-main"><b>${esc(item.title)}</b><small>${esc(item.location?.name || 'regional')} · ${ago(item.publishedAt)} · ${item.independentSources} source${item.independentSources === 1 ? '' : 's'}</small></span>
    <span>${item.confidence}%</span>
    <span>${esc(item.urgency)}</span>
  </button>`).join('') || '<div class="empty"><b>No conflict event passes the current filter.</b><span>Widen the time window or lower the score threshold if needed.</span></div>';

  bindEventCards('.event-row[data-id]', conflictEvents, onSelect);
  return `<div class="table-head"><span>SCORE</span><span>CONFLICT / ESCALATION EVENT</span><span>CONF.</span><span>LEVEL</span></div><div class="event-table">${rows}</div>`;
}

function countriesView(events, reference) {
  const profiles = reference.countryPriorityProfiles || [];
  const eventMap = new Map();
  for (const item of events) {
    const code = item.strategicArea?.countryCode || inferCountryCode(item, reference.countries || []);
    if (!code) continue;
    const list = eventMap.get(code) || [];
    list.push(item);
    eventMap.set(code, list);
  }

  const cards = profiles
    .map(profile => {
      const current = (eventMap.get(profile.countryCode) || []).sort((a,b) => b.signalScore - a.signalScore);
      return { profile, current, top: current[0]?.signalScore || 0 };
    })
    .sort((a,b) => (b.current.length - a.current.length) || (b.top - a.top) || (b.profile.priority - a.profile.priority))
    .map(({profile,current,top}) => `<article class="country-card">
      <div class="country-head"><div><h3>${esc(profile.name)}</h3><small>${esc(profile.regionId)}</small></div><span class="country-current ${current.length ? 'active' : ''}">${current.length} current</span></div>
      <div class="country-stats"><span><b>${profile.priority}</b>coverage priority</span><span><b>${top || '—'}</b>highest current score</span></div>
      <div><small>TRACK</small>${chipList((profile.monitorThemes || []).slice(0,6))}</div>
      <div><small>EXPOSURES</small>${chipList((profile.financialExposures || []).slice(0,6))}</div>
      ${current[0] ? `<p class="country-latest"><b>Latest:</b> ${esc(current[0].title)}</p>` : '<p class="country-latest muted">No current event above the selected threshold.</p>'}
    </article>`).join('');

  return `<section class="workspace-section"><div class="section-intro"><h2>Priority countries</h2><p>Coverage priority is a collection setting, not a risk score. Current counts and event scores come from the selected time window.</p></div><div class="country-grid">${cards}</div></section>`;
}

function briefingView(briefing, onSelect) {
  const high = briefing.critical || [];
  const cards = high.map(item => `<button class="brief-card" data-id="${esc(item.id)}"><span>${item.signalScore}</span><div><b>${esc(item.title)}</b><small>${esc(item.urgency)} · ${esc(item.location?.name || 'regional')}</small><p>${esc(item.whyItMatters)}</p></div></button>`).join('') || '<div class="empty">No high-priority event currently clears the filters.</div>';
  bindEventCards('.brief-card[data-id]', high, onSelect);
  return `<div class="brief-hero"><small>TOP LINE</small><h2>${esc(briefing.headline || 'No high-priority development currently passes the filter.')}</h2><span>${briefing.sourceHealth?.online || 0}/${briefing.sourceHealth?.total || 0} sources online at the last refresh</span></div><section class="workspace-section"><h2>Highest-priority developments</h2><div class="brief-list">${cards}</div></section>`;
}

function opportunityScore(item) {
  const match = Math.max(...(item.market?.rules || []).map(rule => Number(rule.matchScore || 0)),0);
  const sources = Math.min(100, Number(item.independentSources || 0) * 20 + (item.officialPrimary ? 25 : 0));
  return Math.round(clampScore(Number(item.signalScore || 0) * .42 + Number(item.confidence || 0) * .28 + match * .22 + sources * .08,0,100));
}

function chipList(values, cls='') {
  if (!values?.length) return '<span class="muted">No strong match</span>';
  return `<div class="chips ${cls}">${values.map(value => `<span>${esc(value)}</span>`).join('')}</div>`;
}

function isConflict(item) {
  const text = `${item.category || ''} ${item.eventType || ''} ${item.title || ''}`.toLowerCase();
  return item.category === 'conflict' || /missile|airstrike|drone attack|military|ceasefire|troops|mobilisation|war|combat|base attack|naval/.test(text);
}

function inferCountryCode(item, countries) {
  const title = `${item.title || ''} ${item.summary || ''}`.toLowerCase();
  for (const country of countries) {
    const names = [country.name, ...(country.aliases || [])].filter(Boolean);
    if (names.some(name => name.length > 3 && title.includes(String(name).toLowerCase()))) return country.iso2;
  }
  return null;
}

function bindEventCards(selector, events, onSelect) {
  queueMicrotask(() => document.querySelectorAll(selector).forEach(el => {
    el.onclick = () => onSelect(events.find(item => item.id === el.dataset.id));
  }));
}

function clampScore(value,min,max){return Math.max(min,Math.min(max,value));}
