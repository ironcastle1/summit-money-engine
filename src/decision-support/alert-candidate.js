import { recordId } from './id.js';
export function alertCandidates(matches = []) {
  const alerts = [];
  for (const group of matches) for (const signal of group.matches) alerts.push(Object.freeze({
    id: recordId('brief-alert', `${group.watch.id}-${signal.id}`),
    watchId: group.watch.id,
    signalId: signal.id,
    title: signal.title,
    domain: signal.domain,
    score: signal.attention.score,
    priority: signal.attention.band,
    createdAt: new Date().toISOString()
  }));
  return Object.freeze(alerts.sort((a, b) => b.score - a.score));
}
