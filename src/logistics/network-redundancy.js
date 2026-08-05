import { clamp, round } from './numbers.js';
import { shortestPath } from './shortest-path.js';

export function networkRedundancy(graph, originId, destinationId, options = {}) {
  const base = shortestPath(graph, originId, destinationId, edge => Number(edge.distanceKm || 1), options);
  if (!base) {
    return Object.freeze({
      connected: false,
      alternativeCount: 0,
      score: 0,
      criticalEdges: Object.freeze([])
    });
  }

  const viableAlternatives = [];
  const criticalEdges = [];

  for (const edge of base.edges) {
    const diverted = shortestPath(
      graph,
      originId,
      destinationId,
      candidate => Number(candidate.distanceKm || 1),
      {
        ...options,
        avoidRouteIds: [...(options.avoidRouteIds || []), edge.id]
      }
    );

    if (!diverted) {
      criticalEdges.push(edge.id);
      continue;
    }

    const distancePenaltyPct = Math.max(0, (diverted.cost - base.cost) / Math.max(1, base.cost) * 100);
    viableAlternatives.push(Object.freeze({
      avoidedEdgeId: edge.id,
      distancePenaltyPct: round(distancePenaltyPct, 1),
      routeIds: Object.freeze(diverted.edges.map(item => item.id))
    }));
  }

  const alternativeRatio = viableAlternatives.length / Math.max(1, base.edges.length);
  const averagePenalty = viableAlternatives.length
    ? viableAlternatives.reduce((sum, item) => sum + item.distancePenaltyPct, 0) / viableAlternatives.length
    : 100;
  const score = clamp(alternativeRatio * 80 + Math.max(0, 20 - averagePenalty / 5), 0, 100);

  return Object.freeze({
    connected: true,
    alternativeCount: viableAlternatives.length,
    score: round(score, 1),
    criticalEdges: Object.freeze(criticalEdges),
    alternatives: Object.freeze(viableAlternatives),
    baseRouteIds: Object.freeze(base.edges.map(edge => edge.id))
  });
}
