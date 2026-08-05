import { clamp, round } from './numbers.js';

const MODE_BASE_USD_PER_TONNE_KM = Object.freeze({
  SEA: 0.0024,
  RAIL: 0.035,
  ROAD: 0.085,
  AIR: 1.45,
  PIPELINE: 0.008,
  MULTIMODAL: 0.045
});

export function freightRateEstimate(input = {}) {
  const mode = String(input.mode || 'SEA').toUpperCase();
  const distanceKm = Math.max(1, Number(input.distanceKm || 1));
  const cargoTonnes = Math.max(0.001, Number(input.cargoTonnes || 1));
  const baseRate = Math.max(0, Number(input.baseUsdPerTonneKm ?? MODE_BASE_USD_PER_TONNE_KM[mode] ?? MODE_BASE_USD_PER_TONNE_KM.SEA));
  const utilization = clamp(Number(input.utilization ?? 0.82), 0.1, 1.15);
  const imbalance = clamp(Number(input.tradeImbalanceFactor || 1), 0.5, 3);
  const seasonality = clamp(Number(input.seasonalityFactor || 1), 0.5, 3);
  const congestion = clamp(Number(input.congestionScore || 0), 0, 100);
  const risk = clamp(Number(input.riskScore || 0), 0, 100);
  const fuelIndex = clamp(Number(input.fuelIndex || 1), 0.4, 4);
  const contractDiscountPct = clamp(Number(input.contractDiscountPct || 0), 0, 60);

  const utilizationFactor = 0.72 + utilization * 0.34;
  const congestionFactor = 1 + (congestion / 100) ** 2 * 0.55;
  const riskFactor = 1 + risk / 180;
  const discountFactor = 1 - contractDiscountPct / 100;
  const effectiveRate = baseRate * utilizationFactor * imbalance * seasonality * congestionFactor * riskFactor * fuelIndex * discountFactor;
  const linehaulUsd = effectiveRate * distanceKm * cargoTonnes;

  const minimumChargeUsd = Math.max(0, Number(input.minimumChargeUsd || 0));
  const quotedUsd = Math.max(minimumChargeUsd, linehaulUsd);

  return Object.freeze({
    mode,
    quotedUsd: round(quotedUsd, 2),
    linehaulUsd: round(linehaulUsd, 2),
    effectiveUsdPerTonneKm: round(effectiveRate, 6),
    effectiveUsdPerTonne: round(quotedUsd / cargoTonnes, 2),
    factors: Object.freeze({
      utilizationFactor: round(utilizationFactor, 3),
      tradeImbalanceFactor: imbalance,
      seasonalityFactor: seasonality,
      congestionFactor: round(congestionFactor, 3),
      riskFactor: round(riskFactor, 3),
      fuelIndex,
      contractDiscountPct
    })
  });
}

export function baseFreightRates() {
  return Object.entries(MODE_BASE_USD_PER_TONNE_KM).map(([mode, rate]) => Object.freeze({ mode, usdPerTonneKm: rate }));
}
