import { shortestPath } from './shortest-path.js';
function signature(path) { return path.edges.map(edge => edge.id).join('|'); }
export function kShortestPaths(graph, originId, destinationId, edgeCost, count = 5, options = {}) {
  const results = []; const signatures = new Set(); const first = shortestPath(graph, originId, destinationId, edgeCost, options);
  if (!first) return results; results.push(first); signatures.add(signature(first));
  const candidates = [];
  for (let iteration = 1; iteration < count; iteration += 1) {
    const previous = results[iteration - 1];
    for (let index = 0; index < previous.edges.length; index += 1) {
      const banned = new Set(options.avoidRouteIds || []);
      for (const accepted of results) if (accepted.edges.slice(0, index).every((edge, position) => edge.id === previous.edges[position]?.id)) banned.add(accepted.edges[index]?.id);
      const candidate = shortestPath(graph, originId, destinationId, edgeCost, { ...options, avoidRouteIds: [...banned] });
      if (!candidate || signatures.has(signature(candidate))) continue;
      candidates.push(candidate); signatures.add(signature(candidate));
    }
    candidates.sort((a, b) => a.cost - b.cost);
    const next = candidates.shift(); if (!next) break; results.push(next);
  }
  return results;
}
