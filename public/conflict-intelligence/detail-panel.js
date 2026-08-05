import {
  escapeConflict,
  conflictNumber
}
from './format.js';
function metric(label,
value,
note = '') {
  return `<div class="conflict-metric"><span>${label}</span><strong>${conflictNumber(value)}</strong><small>${escapeConflict(note)}</small></div>`;
}
export function conflictDetail(item) {
  if (!item)
  return '<div class="conflict-empty">Select a conflict theatre to inspect its fronts, actors, escalation and exposure.</div>';
  const actors = (item.actors?.nodes || []).slice(0,
  8).map(actor => `<li><b>${escapeConflict(actor.name)}</b><span>${actor.eventCount} events · ${conflictNumber(actor.averageSeverity)}</span></li>`).join('');
  return `<article class="conflict-detail"><header><span>${escapeConflict(item.phase)}</span><h2>${escapeConflict(item.name)}</h2><p>${escapeConflict(item.country || item.region || '')}</p></header><div class="conflict-metric-grid">${metric('RISK',
  item.risk.score,
  item.risk.band)}${metric('ESCALATION',
  item.escalation.score,
  item.escalation.level)}${metric('INTENSITY',
  item.intensity.score,
  `${item.intensity.eventCount} events`)}${metric('CONFIDENCE',
  item.confidence.score,
  item.confidence.band)}${metric('CIVILIAN',
  item.exposure.civilian.score,
  'exposure')}${metric('LOGISTICS',
  item.exposure.logistics.score,
  'exposure')}</div><section><h3>ACTIVE ACTORS</h3><ul class="conflict-actors">${actors || '<li>No actors identified</li>'}</ul></section><section><h3>FRONTS / STRIKES</h3><p>${item.fronts?.length || 0} fronts · ${item.strikes?.count || 0} strike events · ${item.ceasefire?.status || 'NONE'} ceasefire state</p></section></article>`;
}
