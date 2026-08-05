export function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
export function clamp(value, minimum = 0, maximum = 100) {
  return Math.max(minimum, Math.min(maximum, finite(value)));
}
export function round(value, digits = 1) {
  const scale = 10 ** digits;
  return Math.round(finite(value) * scale) / scale;
}
export function mean(values, fallback = 0) {
  const valid = (values || []).map(Number).filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : fallback;
}
export function weightedMean(items, fallback = 0) {
  let total = 0;
  let weight = 0;
  for (const item of items || []) {
    const itemWeight = Math.max(0, finite(item.weight));
    if (!itemWeight || !Number.isFinite(Number(item.value))) continue;
    total += Number(item.value) * itemWeight;
    weight += itemWeight;
  }
  return weight ? total / weight : fallback;
}
export function sum(values) {
  return (values || []).reduce((total, value) => total + finite(value), 0);
}
export function percentile(values, p = 0.5) {
  const sorted = (values || []).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const index = (sorted.length - 1) * clamp(p, 0, 1);
  const low = Math.floor(index);
  const high = Math.ceil(index);
  return low === high ? sorted[low] : sorted[low] + (sorted[high] - sorted[low]) * (index - low);
}
