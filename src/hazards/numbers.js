export function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, finite(value, min)));
}
export function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(finite(value) * factor) / factor;
}
export function mean(values = []) {
  const numbers = values.map(Number).filter(Number.isFinite);
  return numbers.length ? numbers.reduce((a, b)=>a+b, 0)/numbers.length : 0;
}
export function weightedMean(items = []) {
  let weighted = 0, total = 0;
  for (const item of items) {
    const w = Math.max(0, finite(item.weight, 1));
    weighted += finite(item.value) * w;
    total += w;
  }
  return total ? weighted / total : 0;
}
export function percentChange(before, after) {
  const base = Math.abs(finite(before));
  return base ? ((finite(after)-finite(before))/base)*100 : 0;
}
