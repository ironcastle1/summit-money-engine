import { clamp, round } from '../../core/numbers.js';

function component(value, weight, transform = input => input) {
  if (!Number.isFinite(value)) return null;
  return { value: clamp(transform(value), -1, 1), weight };
}

export function scoreSignal(feature, probability) {
  const components = [
    component(feature?.alignment, 1.5),
    component(feature?.rsi14, 0.7, value => (value - 50) / 35),
    component(feature?.roc6, 0.8, value => value * 20),
    component(feature?.roc24, 1.1, value => value * 10),
    component(feature?.trendSlope, 1.2, value => value * 12),
    component(feature?.efficiency20, 0.6, value => (value - 0.25) * 2),
    component(feature?.macdHistogramPct, 0.8, value => value * 80),
    component(feature?.bollingerPosition, 0.5, value => (value - 0.5) * 2),
    component(feature?.moneyFlow14, 0.4, value => (value - 50) / 40),
    component(probability?.riseProbability, 2.2, value => (value - 0.5) * 2)
  ].filter(Boolean);
  if (components.length < 5) return { available: false, score: null, direction: 'N/A', coverage: components.length / 10 };
  const weighted = components.reduce((total, item) => total + item.value * item.weight, 0);
  const weights = components.reduce((total, item) => total + item.weight, 0);
  const normalized = weighted / weights;
  const score = 50 + 50 * normalized;
  let direction = 'NEUTRAL';
  if (score >= 62) direction = 'RISE';
  else if (score <= 38) direction = 'FALL';
  return { available: true, score: round(score, 1), direction, coverage: round(components.length / 10, 2) };
}

export function riskScore(feature, outcome) {
  const values = [];
  if (Number.isFinite(feature?.atrPct)) values.push(clamp(feature.atrPct / 0.06, 0, 1));
  if (Number.isFinite(feature?.volatility20)) values.push(clamp(feature.volatility20 / 1.5, 0, 1));
  if (Number.isFinite(feature?.drawdown90)) values.push(clamp(-feature.drawdown90 / 0.35, 0, 1));
  if (Number.isFinite(feature?.var5)) values.push(clamp(-feature.var5 / 0.08, 0, 1));
  if (Number.isFinite(outcome?.returnRange80?.lower)) values.push(clamp(-outcome.returnRange80.lower / 0.12, 0, 1));
  if (values.length < 3) return { available: false, score: null };
  return { available: true, score: round(100 * values.reduce((a, b) => a + b, 0) / values.length, 1) };
}
