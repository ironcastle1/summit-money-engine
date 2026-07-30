import { stableId } from '../../core/ids.js';
import { mean, round } from '../../core/numbers.js';
import { toTimestamp } from '../../core/time.js';
import { haversineKm } from '../geo/distance.js';

class DisjointSet {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, index) => index);
    this.rank = Array(size).fill(0);
  }
  find(index) {
    if (this.parent[index] !== index) this.parent[index] = this.find(this.parent[index]);
    return this.parent[index];
  }
  union(left, right) {
    const rootLeft = this.find(left);
    const rootRight = this.find(right);
    if (rootLeft === rootRight) return;
    if (this.rank[rootLeft] < this.rank[rootRight]) this.parent[rootLeft] = rootRight;
    else if (this.rank[rootLeft] > this.rank[rootRight]) this.parent[rootRight] = rootLeft;
    else {
      this.parent[rootRight] = rootLeft;
      this.rank[rootLeft] += 1;
    }
  }
}

export function clusterEvents(events, options = {}) {
  const distanceKm = options.distanceKm || 80;
  const timeHours = options.timeHours || 24;
  const sameCategory = options.sameCategory ?? true;
  const set = new DisjointSet(events.length);

  for (let left = 0; left < events.length; left += 1) {
    for (let right = left + 1; right < events.length; right += 1) {
      if (sameCategory && events[left].category !== events[right].category) continue;
      const timeDelta = Math.abs(toTimestamp(events[left].time) - toTimestamp(events[right].time)) / 3_600_000;
      if (timeDelta > timeHours) continue;
      const distance = haversineKm(events[left].lat, events[left].lon, events[right].lat, events[right].lon);
      if (Number.isFinite(distance) && distance <= distanceKm) set.union(left, right);
    }
  }

  const groups = new Map();
  events.forEach((event, index) => {
    const root = set.find(index);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(event);
  });

  return [...groups.values()].map(group => {
    const newest = [...group].sort((a, b) => toTimestamp(b.time) - toTimestamp(a.time))[0];
    return Object.freeze({
      id: stableId('cluster', ...group.map(event => event.id).sort()),
      category: newest.category,
      title: newest.title,
      lat: round(mean(group.map(event => event.lat)), 6),
      lon: round(mean(group.map(event => event.lon)), 6),
      time: newest.time,
      severity: round(Math.max(...group.map(event => event.severity)), 2),
      eventCount: group.length,
      sourceCount: new Set(group.map(event => event.source)).size,
      sources: [...new Set(group.flatMap(event => event.attributes?.sources || [event.source]))],
      eventIds: group.map(event => event.id)
    });
  }).sort((a, b) => toTimestamp(b.time) - toTimestamp(a.time));
}
