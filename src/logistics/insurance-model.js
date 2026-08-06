import { clamp, round } from './numbers.js';
export function insuranceEstimate(input = {}) {
  const cargoValueUsd = Math.max(0, Number(input.cargoValueUsd || 0));
  const baseRate = clamp(Number(input.baseRatePct || 0.18), 0.01, 10);
  const riskScore = clamp(Number(input.riskScore || 0), 0, 100);
  const cargoFactor = Math.max(0.5, Number(input.cargoFactor || 1));
  const warRisk = input.warRiskArea ? 1 + riskScore / 55 : 1;
  const sanctionsFactor = input.sanctionsExposure ? 1.8 : 1;
  const piracyFactor = input.piracyArea ? 1.35 : 1;
  const effectiveRatePct = baseRate * (1 + riskScore / 120) * cargoFactor * warRisk * sanctionsFactor * piracyFactor;
  return Object.freeze({ premiumUsd: round(cargoValueUsd * effectiveRatePct / 100, 2), effectiveRatePct: round(effectiveRatePct, 4), factors: Object.freeze({ warRisk, sanctionsFactor, piracyFactor, cargoFactor }) });
}
