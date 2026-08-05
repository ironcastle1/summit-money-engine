export function conflictContradictions(events = []) {
  const groups = new Map();
  for (const event of events) {
    const key = `${Math.round(event.lat * 2) / 2}:${Math.round(event.lon * 2) / 2}:${String(event.title).toLowerCase().replace(/\b(killed|captured|destroyed|denied|claimed)\b/g,
    '').slice(0,
    60)}`;
    const group = groups.get(key) || [];
    group.push(event);
    groups.set(key,
    group);
  }
  const contradictions = [];
  for (const [key,
  group] of groups) {
    const text = group.map(event => event.title.toLowerCase()).join(' '),
    opposed = (text.includes('captured') && text.includes('denied')) || (text.includes('destroyed') && text.includes('undamaged')) || (text.includes('killed') && text.includes('alive'));
    if (opposed)
    contradictions.push(Object.freeze({
      id: key,
      eventIds: group.map(e => e.id),
      sources: [...new Set(group.map(e => e.evidence.source))],
      severity: group.length >= 3 ? 'HIGH' : 'MEDIUM'
    }));
  }
  return Object.freeze({
    count: contradictions.length,
    items: contradictions
  });
}
