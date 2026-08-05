import {
  escapeConflict,
  conflictNumber
}
from './format.js';
export function conflictTimeline(items = []) {
  return `<div class="conflict-timeline">${items.slice(0,
  20).map(item => `<article><time>${escapeConflict(new Date(item.time).toLocaleString())}</time><b>${escapeConflict(item.type)}</b><p>${escapeConflict(item.title)}</p><span>${conflictNumber(item.severity)}</span></article>`).join('')}</div>`;
}
