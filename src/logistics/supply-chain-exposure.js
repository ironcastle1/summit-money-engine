import { clamp, round } from './numbers.js';

export function supplyChainExposure(routes = [], context = {}) {
  if (!routes.length) {
    return Object.freeze({
      available: false,
      reason: 'NO_ROUTES'
    });
  }

  const recommended = routes.find(route => route.recommended) || routes[0];
  const risk = clamp(Number(recommended.metrics?.exposure?.risk?.score || 0), 0, 100);
  const reliability = clamp(Number(recommended.metrics?.reliability?.score || 0), 0, 100);
  const alternativeCount = Math.max(0, routes.length - 1);
  const criticalSupplierSharePct = clamp(Number(context.criticalSupplierSharePct || 0), 0, 100);
  const singleSourceSharePct = clamp(Number(context.singleSourceSharePct || 0), 0, 100);
  const inventoryCoverDays = Math.max(0, Number(context.inventoryCoverDays || 0));
  const leadTimeDays = Math.max(0, Number(recommended.metrics?.eta?.durationDays || 0));

  const routeConcentration = alternativeCount === 0 ? 100 : Math.max(0, 100 - alternativeCount * 18);
  const inventoryGap = Math.max(0, leadTimeDays - inventoryCoverDays);
  const inventoryRisk = clamp(inventoryGap / Math.max(1, leadTimeDays) * 100, 0, 100);
  const score = clamp(
    risk * 0.28 +
    (100 - reliability) * 0.18 +
    routeConcentration * 0.16 +
    criticalSupplierSharePct * 0.14 +
    singleSourceSharePct * 0.14 +
    inventoryRisk * 0.10,
    0,
    100
  );

  const actions = [];
  if (alternativeCount < 2) actions.push('Develop at least two viable route alternatives');
  if (singleSourceSharePct >= 50) actions.push('Reduce single-source dependency');
  if (inventoryGap > 0) actions.push(`Increase inventory cover by approximately ${round(inventoryGap, 1)} days`);
  if (risk >= 60) actions.push('Escalate route monitoring and insurance review');
  if (reliability < 65) actions.push('Renegotiate service-level and delay clauses');

  return Object.freeze({
    available: true,
    score: round(score, 1),
    band: score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'ELEVATED' : score >= 20 ? 'GUARDED' : 'LOW',
    recommendedRouteId: recommended.id,
    routeAlternativeCount: alternativeCount,
    inventoryGapDays: round(inventoryGap, 1),
    components: Object.freeze({
      routeRisk: risk,
      unreliability: round(100 - reliability, 1),
      routeConcentration: round(routeConcentration, 1),
      criticalSupplierSharePct,
      singleSourceSharePct,
      inventoryRisk: round(inventoryRisk, 1)
    }),
    actions: Object.freeze(actions)
  });
}
