import { round } from './numbers.js';
export function detectChanges(current = [], previous = []) {
  const old = new Map((previous || []).map(item => [item.id, item]));
  const currentIds = new Set(current.map(item => item.id));
  const added = [];
  const escalated = [];
  const deescalated = [];
  for (const item of current) {
    const before = old.get(item.id);
    if (!before) { added.push(item); continue; }
    const delta = round((item.attention?.score || 0) - (before.attention?.score || 0), 1);
    if (delta >= 8) escalated.push(Object.freeze({ item, before: before.attention?.score || 0, delta }));
    if (delta <= -8) deescalated.push(Object.freeze({ item, before: before.attention?.score || 0, delta }));
  }
  const removed = previous.filter(item => !currentIds.has(item.id));
  return Object.freeze({ added: Object.freeze(added), escalated: Object.freeze(escalated), deescalated: Object.freeze(deescalated), removed: Object.freeze(removed) });
}
