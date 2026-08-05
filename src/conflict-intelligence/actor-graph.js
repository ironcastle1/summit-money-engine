import {
  round
}
from './numbers.js';
export function buildActorGraph(events = []) {
  const nodes = new Map(),
  edges = new Map();
  for (const event of events) {
    for (const actor of event.actors || []) {
      const current = nodes.get(actor.id) || {
        ...actor,
        eventCount: 0,
        severityTotal: 0,
        firstSeen: event.time,
        lastSeen: event.time
      };
      current.eventCount++;
      current.severityTotal += Number(event.severity) || 0;
      if (event.time < current.firstSeen)
      current.firstSeen = event.time;
      if (event.time > current.lastSeen)
      current.lastSeen = event.time;
      nodes.set(actor.id,
      current);
    }
    const actors = event.actors || [];
    for (let i = 0;
    i < actors.length;
    i++)
    for (let j = i + 1;
    j < actors.length;
    j++) {
      const [a,
      b] = [actors[i].id,
      actors[j].id].sort(),
      key = `${a}:${b}`,
      edge = edges.get(key) || {
        id: key,
        source: a,
        target: b,
        events: 0,
        hostility: 0
      };
      edge.events++;
      edge.hostility += event.type === 'CEASEFIRE' ? -.5 : 1;
      edges.set(key,
      edge);
    }
  }
  return Object.freeze({
    nodes: [...nodes.values()].map(node => Object.freeze({
      ...node,
      averageSeverity: round(node.severityTotal / node.eventCount,
      1)
    })),
    edges: [...edges.values()].map(edge => Object.freeze({
      ...edge,
      hostility: round(edge.hostility,
      1)
    }))
  });
}
