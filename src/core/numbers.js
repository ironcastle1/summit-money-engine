export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function round(value, digits = 0) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function mean(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? finite.reduce((sum, value) => sum + value, 0) / finite.length : null;
}

export function median(values) {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!finite.length) return null;
  const middle = Math.floor(finite.length / 2);
  return finite.length % 2 ? finite[middle] : (finite[middle - 1] + finite[middle]) / 2;
}

export function sum(values) {
  return values.filter(Number.isFinite).reduce((total, value) => total + value, 0);
}

export function standardDeviation(values) {
  const average = mean(values);
  if (!Number.isFinite(average)) return null;
  const variance = mean(values.map(value => (value - average) ** 2));
  return Number.isFinite(variance) ? Math.sqrt(variance) : null;
}

export function percentile(values, probability) {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!finite.length) return null;
  const index = clamp(probability, 0, 1) * (finite.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return finite[lower];
  const weight = index - lower;
  return finite[lower] * (1 - weight) + finite[upper] * weight;
}
