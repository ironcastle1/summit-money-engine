import { clamp, round } from './numbers.js';

function normalApproximationZ(probability) {
  const p = clamp(probability, 0.5001, 0.9999);
  const a = 0.147;
  const sign = p >= 0.5 ? 1 : -1;
  const x = 2 * p - 1;
  const ln = Math.log(1 - x * x);
  const inside = 2 / (Math.PI * a) + ln / 2;
  return sign * Math.sqrt(Math.sqrt(inside * inside - ln / a) - inside) * Math.SQRT2;
}

export function serviceLevelEstimate(input = {}) {
  const reliability = clamp(Number(input.reliabilityScore || 0), 0, 100) / 100;
  const target = clamp(Number(input.targetServiceLevelPct || 95), 50, 99.99) / 100;
  const demandStdDevPerDay = Math.max(0, Number(input.demandStdDevPerDay || 0));
  const leadTimeDays = Math.max(0.01, Number(input.leadTimeDays || 1));
  const leadTimeStdDevDays = Math.max(0, Number(input.leadTimeStdDevDays || 0));
  const averageDailyDemand = Math.max(0, Number(input.averageDailyDemand || 0));

  const targetZ = normalApproximationZ(target);
  const combinedDemandVariance = demandStdDevPerDay ** 2 * leadTimeDays;
  const combinedLeadVariance = averageDailyDemand ** 2 * leadTimeStdDevDays ** 2;
  const safetyStockUnits = targetZ * Math.sqrt(combinedDemandVariance + combinedLeadVariance);
  const achieved = clamp(reliability * target + (1 - target) * 0.5, 0, 0.999);
  const expectedStockoutProbability = 1 - achieved;

  return Object.freeze({
    targetServiceLevelPct: round(target * 100, 2),
    achievedServiceLevelPct: round(achieved * 100, 2),
    expectedStockoutProbabilityPct: round(expectedStockoutProbability * 100, 2),
    safetyStockUnits: round(safetyStockUnits, 2),
    targetZ: round(targetZ, 3),
    meetsTarget: achieved >= target
  });
}
