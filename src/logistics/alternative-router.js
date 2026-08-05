import { kShortestPaths } from './k-shortest-paths.js';
import { cargoCompatibility } from './cargo-compatibility.js';
import { routePolicy } from './route-policy.js';
import { calculateRouteMetrics } from './route-metrics.js';
import { rankRoutes } from './route-score.js';
export function planAlternatives(graph, request, context = {}) {
  const policy = routePolicy(request.policyId); const maximum = Math.min(request.maximumAlternatives, policy.maximumAlternatives || request.maximumAlternatives);
  const edgeCost = edge => {
    const compatibility = cargoCompatibility(request.cargoClass, request.vesselClass, edge); if (!compatibility.compatible) return Infinity;
    const risk = Number(context.edgeRiskById?.get?.(edge.id)?.score || 0); if (policy.avoidCriticalRisk && risk >= 80) return Infinity;
    const time = edge.distanceKm / Math.max(1, edge.baseSpeedKmh); const approximateCost = edge.distanceKm * Math.max(1, request.cargoTonnes) * 0.0025;
    const reliabilityPenalty = Number(context.edgeReliabilityById?.get?.(edge.id) ?? 80); return time * policy.weights.time + approximateCost / 1000 * policy.weights.cost + risk * policy.weights.risk + (100 - reliabilityPenalty) * policy.weights.reliability;
  };
  const paths = kShortestPaths(graph, request.originId, request.destinationId, edgeCost, maximum, request);
  const routes = paths.map((path, index) => Object.freeze({ id: `plan-${index + 1}`, path, metrics: calculateRouteMetrics(path, request, context) }));
  return rankRoutes(routes, policy.id);
}
