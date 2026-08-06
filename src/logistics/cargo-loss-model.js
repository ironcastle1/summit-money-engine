import { clamp, round } from './numbers.js';

export function cargoLossEstimate(input = {}) {
  const cargoValueUsd = Math.max(0, Number(input.cargoValueUsd || 0));
  const baseLossProbability = clamp(Number(input.baseLossProbability || 0.0008), 0, 1);
  const riskScore = clamp(Number(input.riskScore || 0), 0, 100);
  const handlingCount = clamp(Number(input.handlingCount || 2), 0, 30);
  const perishability = clamp(Number(input.perishability || 0), 0, 1);
  const temperatureControlReliability = clamp(Number(input.temperatureControlReliability ?? 1), 0, 1);
  const hazardous = clamp(Number(input.hazardFactor || 0), 0, 1);
  const transitDays = Math.max(0, Number(input.transitDays || 0));

  const handlingProbability = handlingCount * 0.00022;
  const riskProbability = (riskScore / 100) ** 2 * 0.018;
  const perishabilityProbability = perishability * (1 - temperatureControlReliability) * Math.min(0.12, transitDays / 180);
  const hazardousProbability = hazardous * 0.004;
  const probability = clamp(
    baseLossProbability + handlingProbability + riskProbability + perishabilityProbability + hazardousProbability,
    0,
    0.5
  );

  const expectedLossUsd = cargoValueUsd * probability;

  return Object.freeze({
    probability: round(probability, 6),
    probabilityPct: round(probability * 100, 4),
    expectedLossUsd: round(expectedLossUsd, 2),
    components: Object.freeze({
      baseLossProbability,
      handlingProbability: round(handlingProbability, 6),
      riskProbability: round(riskProbability, 6),
      perishabilityProbability: round(perishabilityProbability, 6),
      hazardousProbability: round(hazardousProbability, 6)
    })
  });
}
