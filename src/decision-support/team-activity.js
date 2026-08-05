export function teamActivitySummary(activity = []) {
  const counts = new Map();
  for (const item of activity) counts.set(item.type || 'ACTIVITY', (counts.get(item.type || 'ACTIVITY') || 0) + 1);
  return Object.freeze({ total: activity.length, byType: Object.freeze([...counts.entries()].map(([type, count]) => Object.freeze({ type, count }))), latest: Object.freeze(activity.slice(0, 20)) });
}
