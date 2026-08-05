import {
  escapeConflict,
  conflictNumber,
  conflictBand
}
from './format.js';
export function theatreTable(theatres = [],
query = '') {
  const filtered = theatres.filter(item => `${item.name} ${item.country || ''} ${item.region || ''}`.toLowerCase().includes(query.toLowerCase()));
  return `<div class="conflict-table">${filtered.map(item => `<button type="button" data-conflict-id="${escapeConflict(item.id)}"><span class="conflict-risk ${conflictBand(item.risk.score)}">${conflictNumber(item.risk.score)}</span><span><b>${escapeConflict(item.name)}</b><small>${escapeConflict(`${item.phase} · ${item.eventCount} events · confidence ${conflictNumber(item.confidence.score)}`)}</small></span><span><b>${conflictNumber(item.escalation.score)}</b><small>ESCALATION</small></span></button>`).join('') || '<div class="conflict-empty">No theatres match this filter.</div>'}</div>`;
}
