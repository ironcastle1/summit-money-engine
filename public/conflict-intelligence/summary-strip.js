import {
  conflictNumber
}
from './format.js';
export function conflictSummary(summary = {
}) {
  return [['THEATRES',
  summary.theatres,
  'active'],
  ['EVENTS',
  summary.events,
  'source records'],
  ['CRITICAL',
  summary.critical,
  '65+ risk'],
  ['INTENSE',
  summary.intense,
  'current phase'],
  ['AVG RISK',
  conflictNumber(summary.averageRisk),
  '0–100']].map(([label,
  value,
  note]) => `<div class="sheet-stat"><span>${label}</span><strong>${value ?? 0}</strong><small>${note}</small></div>`).join('');
}
