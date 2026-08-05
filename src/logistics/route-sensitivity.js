import { round } from './numbers.js';

function perturb(value, fraction) {
  return Number(value || 0) * (1 + fraction);
}

export function routeSensitivity(route, options = {}) {
  const fuelShockPct = Number(options.fuelShockPct || 25);
  const delayShockHours = Number(options.delayShockHours || 24);
  const riskShockPoints = Number(options.riskShockPoints || 15);
  const carbonShockPct = Number(options.carbonShockPct || 50);

  const baselineCost = Number(route.metrics?.cost?.totalUsd || 0);
  const bunkerCost = Number(route.metrics?.cost?.bunkerCostUsd || 0);
  const carbonCost = Number(route.metrics?.cost?.carbonCostUsd || 0);
  const baselineHours = Number(route.metrics?.eta?.durationHours || 0);
  const baselineRisk = Number(route.metrics?.exposure?.risk?.score || 0);
  const charterCost = Number(route.metrics?.cost?.charterUsd || 0);
  const charterPerHour = baselineHours > 0 ? charterCost / baselineHours : 0;

  const fuelScenarioCost = baselineCost - bunkerCost + perturb(bunkerCost, fuelShockPct / 100);
  const delayScenarioCost = baselineCost + charterPerHour * delayShockHours;
  const carbonScenarioCost = baselineCost - carbonCost + perturb(carbonCost, carbonShockPct / 100);
  const riskScenarioScore = Math.min(100, baselineRisk + riskShockPoints);

  const scenarios = Object.freeze([
    Object.freeze({
      id: 'FUEL_SHOCK',
      change: `${fuelShockPct}%`,
      totalCostUsd: round(fuelScenarioCost, 2),
      costDeltaUsd: round(fuelScenarioCost - baselineCost, 2)
    }),
    Object.freeze({
      id: 'DELAY_SHOCK',
      change: `${delayShockHours}h`,
      durationHours: round(baselineHours + delayShockHours, 1),
      totalCostUsd: round(delayScenarioCost, 2),
      costDeltaUsd: round(delayScenarioCost - baselineCost, 2)
    }),
    Object.freeze({
      id: 'RISK_SHOCK',
      change: `${riskShockPoints} points`,
      riskScore: round(riskScenarioScore, 1)
    }),
    Object.freeze({
      id: 'CARBON_SHOCK',
      change: `${carbonShockPct}%`,
      totalCostUsd: round(carbonScenarioCost, 2),
      costDeltaUsd: round(carbonScenarioCost - baselineCost, 2)
    })
  ]);

  return Object.freeze({
    baseline: Object.freeze({
      totalCostUsd: round(baselineCost, 2),
      durationHours: round(baselineHours, 1),
      riskScore: round(baselineRisk, 1)
    }),
    scenarios
  });
}
