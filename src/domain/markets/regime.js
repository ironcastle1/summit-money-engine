import { clamp, round } from '../../core/numbers.js';

export function classifyRegime(feature) {
  if (!feature) return { id: 'UNAVAILABLE', trend: null, volatility: null, score: null };
  const trendInputs = [feature.alignment, feature.efficiency20, Number.isFinite(feature.trendSlope) ? clamp(feature.trendSlope * 10, -1, 1) : null].filter(Number.isFinite);
  const trendScore = trendInputs.length ? trendInputs.reduce((a, b) => a + b, 0) / trendInputs.length : null;
  const volatility = feature.volatility20;
  const atr = feature.atrPct;
  let volatilityState = 'NORMAL_VOLATILITY';
  if (Number.isFinite(volatility) && volatility > 1.2 || Number.isFinite(atr) && atr > 0.05) volatilityState = 'HIGH_VOLATILITY';
  else if (Number.isFinite(volatility) && volatility < 0.3 && Number.isFinite(atr) && atr < 0.012) volatilityState = 'LOW_VOLATILITY';
  let trend = 'RANGE';
  if (Number.isFinite(trendScore) && trendScore >= 0.35) trend = 'UPTREND';
  else if (Number.isFinite(trendScore) && trendScore <= -0.35) trend = 'DOWNTREND';
  const id = `${trend}_${volatilityState}`;
  return { id, trend, volatility: volatilityState, score: round(trendScore, 3) };
}
