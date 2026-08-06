export function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
export function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, finite(value, minimum)));
}
export function round(value, digits = 4) {
  const scale = 10 ** digits;
  return Math.round((finite(value) + Number.EPSILON) * scale) / scale;
}
export function mean(values = []) {
  const clean = values.map(Number).filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
}
export function median(values = []) {
  const clean = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return 0;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
}
export function standardDeviation(values = []) {
  const clean = values.map(Number).filter(Number.isFinite);
  if (clean.length < 2) return 0;
  const average = mean(clean);
  return Math.sqrt(clean.reduce((sum, value) => sum + (value - average) ** 2, 0) / (clean.length - 1));
}
export function percentile(values = [], probability = 0.5) {
  const clean = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return 0;
  const index = clamp(probability) * (clean.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return round(clean[lower] + (clean[upper] - clean[lower]) * (index - lower), 8);
}
export function weightedMean(items = [], valueKey = 'value', weightKey = 'weight') {
  let weighted = 0;
  let weights = 0;
  for (const item of items) {
    const value = finite(item?.[valueKey], NaN);
    const weight = Math.max(0, finite(item?.[weightKey], 0));
    if (!Number.isFinite(value) || !weight) continue;
    weighted += value * weight;
    weights += weight;
  }
  return weights ? weighted / weights : 0;
}
