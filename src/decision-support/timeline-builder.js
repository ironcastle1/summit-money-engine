import { sortNewest } from './time.js';
export function decisionTimeline(signals = [], activity = [], limit = 250) {
  const signalItems = signals.map(signal => Object.freeze({ id: signal.id, type: 'SIGNAL', time: signal.time, title: signal.title, domain: signal.domain, score: signal.attention.score }));
  const activityItems = activity.map(item => Object.freeze({ id: item.id, type: item.type || 'ACTIVITY', time: item.time || item.updatedAt || item.createdAt, title: item.title || item.action || item.type, domain: item.domain || 'WORKSPACE', score: Number(item.score || 0) }));
  return Object.freeze(sortNewest([...signalItems, ...activityItems]).slice(0, limit));
}
