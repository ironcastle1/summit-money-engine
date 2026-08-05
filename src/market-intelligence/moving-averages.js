import { mean, round } from './numbers.js';
export function simpleMovingAverage(values = [], period = 20) {
  const clean = values.map(Number).filter(Number.isFinite);
  const length = Math.max(1, Math.floor(period));
  return clean.length ? round(mean(clean.slice(-length)), 8) : 0;
}
export function exponentialMovingAverage(values = [], period = 20) {
  const clean = values.map(Number).filter(Number.isFinite);
  if (!clean.length) return 0;
  const multiplier = 2 / (Math.max(1, period) + 1);
  let value = clean[0];
  for (const next of clean.slice(1)) value = (next - value) * multiplier + value;
  return round(value, 8);
}
export function movingAverageSeries(values = [], period = 20) {
  const clean = values.map(Number).filter(Number.isFinite);
  return clean.map((_, index) => simpleMovingAverage(clean.slice(0, index + 1), period));
}
export function crossover(values = [], fast = 20, slow = 50) {
  if (values.length < 2) return 'NONE';
  const prior = values.slice(0, -1);
  const priorFast = exponentialMovingAverage(prior, fast); const priorSlow = exponentialMovingAverage(prior, slow);
  const currentFast = exponentialMovingAverage(values, fast); const currentSlow = exponentialMovingAverage(values, slow);
  if (priorFast <= priorSlow && currentFast > currentSlow) return 'BULLISH';
  if (priorFast >= priorSlow && currentFast < currentSlow) return 'BEARISH';
  return currentFast >= currentSlow ? 'ABOVE' : 'BELOW';
}
