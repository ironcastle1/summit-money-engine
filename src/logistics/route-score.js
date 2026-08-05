import { routePolicy } from './route-policy.js';
import { clamp, round } from './numbers.js';
function normalizeAgainst(value, minimum, maximum) { if (maximum <= minimum) return 0; return clamp((value - minimum) / (maximum - minimum), 0, 1); }
export function rankRoutes(routes, policyId = 'BALANCED') {
  const policy = routePolicy(policyId); if (!routes.length) return [];
  const times = routes.map(route => route.metrics.eta.durationHours); const costs = routes.map(route => route.metrics.cost.totalUsd);
  const minTime = Math.min(...times); const maxTime = Math.max(...times); const minCost = Math.min(...costs); const maxCost = Math.max(...costs);
  return routes.map(route => {
    const time = normalizeAgainst(route.metrics.eta.durationHours, minTime, maxTime); const cost = normalizeAgainst(route.metrics.cost.totalUsd, minCost, maxCost);
    const risk = route.metrics.exposure.risk.score / 100; const unreliability = 1 - route.metrics.reliability.score / 100;
    const score = 100 * (time * policy.weights.time + cost * policy.weights.cost + risk * policy.weights.risk + unreliability * policy.weights.reliability);
    return Object.freeze({ ...route, policyScore: round(score, 2), policyId: policy.id, rejected: policy.avoidCriticalRisk && route.metrics.exposure.risk.score >= 80 });
  }).sort((a, b) => Number(a.rejected) - Number(b.rejected) || a.policyScore - b.policyScore).map((route, index) => Object.freeze({ ...route, rank: index + 1, recommended: index === 0 && !route.rejected }));
}
