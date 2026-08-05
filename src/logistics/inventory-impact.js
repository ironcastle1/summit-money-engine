import { round } from './numbers.js';

export function inventoryImpact(input = {}) {
  const cargoValueUsd = Math.max(0, Number(input.cargoValueUsd || 0));
  const durationDays = Math.max(0, Number(input.durationDays || 0));
  const annualHoldingRate = Math.max(0, Number(input.annualHoldingRatePct || 18)) / 100;
  const costOfCapital = Math.max(0, Number(input.costOfCapitalPct || 10)) / 100;
  const safetyStockDays = Math.max(0, Number(input.safetyStockDays || 0));
  const uncertaintyDays = Math.max(0, Number(input.uncertaintyDays || 0));
  const dailyDemandUnits = Math.max(0, Number(input.dailyDemandUnits || 0));
  const unitValueUsd = Math.max(0, Number(input.unitValueUsd || 0));

  const holdingCostUsd = cargoValueUsd * annualHoldingRate * durationDays / 365;
  const financingCostUsd = cargoValueUsd * costOfCapital * durationDays / 365;
  const additionalSafetyStockDays = Math.max(0, uncertaintyDays - safetyStockDays);
  const additionalSafetyStockUnits = dailyDemandUnits * additionalSafetyStockDays;
  const additionalSafetyStockValueUsd = additionalSafetyStockUnits * unitValueUsd;
  const totalWorkingCapitalUsd = cargoValueUsd + additionalSafetyStockValueUsd;

  return Object.freeze({
    holdingCostUsd: round(holdingCostUsd, 2),
    financingCostUsd: round(financingCostUsd, 2),
    totalCarryingCostUsd: round(holdingCostUsd + financingCostUsd, 2),
    additionalSafetyStockDays: round(additionalSafetyStockDays, 2),
    additionalSafetyStockUnits: round(additionalSafetyStockUnits, 2),
    additionalSafetyStockValueUsd: round(additionalSafetyStockValueUsd, 2),
    totalWorkingCapitalUsd: round(totalWorkingCapitalUsd, 2)
  });
}
