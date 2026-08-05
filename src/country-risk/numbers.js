export function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
export function clamp(value, minimum = 0, maximum = 100) {
  return Math.max(minimum, Math.min(maximum, finite(value)));
}
export function round(value, digits = 1) {
  const scale = 10 ** digits;
  return Math.round(finite(value) * scale) / scale;
}
export function mean(values, fallback = 0) {
  const valid = values.map(Number).filter(Number.isFinite);
  return valid.length ? valid.reduce((a,b)=>a+b,0)/valid.length : fallback;
}
export function weightedMean(items, fallback = 0) {
  let weighted = 0;
  let weight = 0;
  for (const item of items || []) {
    const w = Math.max(0, finite(item.weight));
    if (!w || !Number.isFinite(Number(item.value))) continue;
    weighted += Number(item.value) * w;
    weight += w;
  }
  return weight ? weighted / weight : fallback;
}
export function sigmoid(value, midpoint = 0, steepness = 1) {
  return 1 / (1 + Math.exp(-steepness * (finite(value) - midpoint)));
}
export function percentChange(current, previous) {
  return previous ? (finite(current) - finite(previous)) / Math.abs(finite(previous)) * 100 : 0;
}
