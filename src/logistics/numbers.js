export function finite(value, fallback = 0) { const number = Number(value); return Number.isFinite(number) ? number : fallback; }
export function clamp(value, minimum, maximum) { return Math.min(maximum, Math.max(minimum, finite(value))); }
export function round(value, digits = 2) { const scale = 10 ** digits; return Math.round((finite(value) + Number.EPSILON) * scale) / scale; }
export function mean(values) { const clean = values.map(Number).filter(Number.isFinite); return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : null; }
export function weightedMean(items) {
  const clean = items.filter(item => Number.isFinite(Number(item.value)) && Number(item.weight) > 0);
  const denominator = clean.reduce((sum, item) => sum + Number(item.weight), 0);
  return denominator ? clean.reduce((sum, item) => sum + Number(item.value) * Number(item.weight), 0) / denominator : null;
}
export function percentile(values, quantile) {
  const sorted = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const position = clamp(quantile, 0, 1) * (sorted.length - 1);
  const lower = Math.floor(position); const upper = Math.ceil(position); const ratio = position - lower;
  return sorted[lower] * (1 - ratio) + sorted[upper] * ratio;
}
export function logistic(value, midpoint = 0, steepness = 1) { return 1 / (1 + Math.exp(-steepness * (finite(value) - midpoint))); }
export function safeDivide(numerator, denominator, fallback = null) { return Number(denominator) === 0 ? fallback : finite(numerator) / finite(denominator); }
