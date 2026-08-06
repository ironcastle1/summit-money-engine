import { clamp, round } from './numbers.js';
export function propagateDisruption(graph, seedNodeIds = [], options = {}) {
  const maximumDepth = Math.max(1, Math.min(8, Number(options.maximumDepth || 4))); const decay = Math.max(0.1, Math.min(0.95, Number(options.decay || 0.62)));
  const seedScore = clamp(Number(options.seedScore || 100), 0, 100); const queue = seedNodeIds.map(id => ({ id: String(id).toLowerCase(), depth: 0, score: seedScore, via: null }));
  const impacts = new Map();
  while (queue.length) {
    const current = queue.shift(); const existing = impacts.get(current.id); if (existing && existing.score >= current.score) continue;
    impacts.set(current.id, Object.freeze(current)); if (current.depth >= maximumDepth) continue;
    for (const edge of graph.neighbors(current.id)) {
      const edgeImportance = clamp(Number(edge.importance || 50), 0, 100) / 100; const nextScore = current.score * decay * (0.6 + edgeImportance * 0.4);
      if (nextScore < 5) continue; queue.push({ id: edge.to, depth: current.depth + 1, score: nextScore, via: edge.id });
    }
  }
  return Object.freeze({ impacts: Object.freeze([...impacts.entries()].map(([id, value]) => Object.freeze({ id, depth: value.depth, score: round(value.score, 1), via: value.via })).sort((a, b) => b.score - a.score)), maximumDepth, decay, generatedAt: new Date().toISOString() });
}
