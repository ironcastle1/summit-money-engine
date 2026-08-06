import { clamp, round } from './numbers.js';
export function classifyMarketRegime(input = {}) {
  const breadth = Number(input.breadth?.score ?? input.breadth ?? 50); const volatility = Number(input.volatility ?? 50);
  const liquidity = Number(input.liquidity ?? 50); const inflation = Number(input.inflationPressure ?? 50); const growth = Number(input.growthPressure ?? 50);
  const riskScore = clamp(breadth * 0.45 + liquidity * 0.25 + (100 - volatility) * 0.3, 0, 100);
  let regime = 'TRANSITION';
  if (inflation >= 62 && growth <= 42) regime = 'STAGFLATION';
  else if (inflation >= 62) regime = 'INFLATION';
  else if (inflation <= 38 && growth >= 48) regime = 'DISINFLATION';
  else if (riskScore >= 62) regime = 'RISK_ON';
  else if (riskScore <= 38) regime = 'RISK_OFF';
  return Object.freeze({ regime, confidence: round(Math.min(100, Math.abs(riskScore - 50) * 2 + Math.abs(inflation - 50)), 2), riskScore: round(riskScore, 2), inputs: Object.freeze({ breadth, volatility, liquidity, inflation, growth }) });
}
