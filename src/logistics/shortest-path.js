import { PriorityQueue } from './priority-queue.js';
export function shortestPath(graph, originId, destinationId, edgeCost, options = {}) {
  const origin = String(originId).toLowerCase(); const destination = String(destinationId).toLowerCase();
  if (!graph.node(origin) || !graph.node(destination)) return null;
  const queue = new PriorityQueue().push(origin, 0); const distances = new Map([[origin, 0]]); const previous = new Map(); const visited = new Set();
  const avoidNodes = new Set(options.avoidNodeIds || []); const avoidEdges = new Set(options.avoidRouteIds || []);
  while (queue.size) {
    const current = queue.pop(); if (!current) break; const nodeId = current.value;
    if (visited.has(nodeId)) continue; visited.add(nodeId);
    if (nodeId === destination) break;
    for (const edge of graph.neighbors(nodeId)) {
      if (avoidEdges.has(edge.id) || avoidNodes.has(edge.to)) continue;
      const cost = Number(edgeCost(edge, graph.node(edge.from), graph.node(edge.to)));
      if (!Number.isFinite(cost) || cost < 0) continue;
      const candidate = (distances.get(nodeId) ?? Infinity) + cost;
      if (candidate >= (distances.get(edge.to) ?? Infinity)) continue;
      distances.set(edge.to, candidate); previous.set(edge.to, { nodeId, edge }); queue.push(edge.to, candidate);
    }
  }
  if (!distances.has(destination)) return null;
  const nodes = [destination]; const edges = []; let cursor = destination;
  while (cursor !== origin) { const step = previous.get(cursor); if (!step) return null; edges.unshift(step.edge); cursor = step.nodeId; nodes.unshift(cursor); }
  return Object.freeze({ originId: origin, destinationId: destination, cost: distances.get(destination), nodeIds: Object.freeze(nodes), edges: Object.freeze(edges) });
}
