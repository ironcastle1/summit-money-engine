import { round } from './numbers.js';
export function compareRoutes(routes = []) {
  if (!routes.length) return { routes: [], deltas: {} };
  const baseline = routes[0];
  const compared = routes.map(route => Object.freeze({
    id: route.id,
    rank: route.rank,
    recommended: route.recommended,
    policyScore: route.policyScore,
    distanceKm: route.metrics.distanceKm,
    durationHours: route.metrics.eta.durationHours,
    totalCostUsd: route.metrics.cost.totalUsd,
    riskScore: route.metrics.exposure.risk.score,
    reliabilityScore: route.metrics.reliability.score,
    co2Tonnes: route.metrics.cost.emissions.co2Tonnes,
    versusRecommended: Object.freeze({
      distanceKm: round(route.metrics.distanceKm - baseline.metrics.distanceKm, 1),
      durationHours: round(route.metrics.eta.durationHours - baseline.metrics.eta.durationHours, 1),
      totalCostUsd: round(route.metrics.cost.totalUsd - baseline.metrics.cost.totalUsd, 2),
      riskScore: round(route.metrics.exposure.risk.score - baseline.metrics.exposure.risk.score, 1),
      reliabilityScore: round(route.metrics.reliability.score - baseline.metrics.reliability.score, 1),
      co2Tonnes: round(route.metrics.cost.emissions.co2Tonnes - baseline.metrics.cost.emissions.co2Tonnes, 2)
    })
  }));
  return Object.freeze({ routes: Object.freeze(compared), recommendedId: baseline.id, generatedAt: new Date().toISOString() });
}
