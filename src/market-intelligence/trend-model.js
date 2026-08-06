import { clamp, round } from './numbers.js';
import { crossover, exponentialMovingAverage, simpleMovingAverage } from './moving-averages.js';
export function calculateTrend(prices = []) {
  const clean = prices.map(Number).filter(value => Number.isFinite(value) && value > 0);
  if (!clean.length) return Object.freeze({ score: 50, direction: 'NEUTRAL', strength: 0, averages: {} });
  const price = clean.at(-1); const sma20 = simpleMovingAverage(clean, 20); const sma50 = simpleMovingAverage(clean, 50);
  const sma200 = simpleMovingAverage(clean, 200); const ema12 = exponentialMovingAverage(clean, 12); const ema26 = exponentialMovingAverage(clean, 26);
  const components = [price >= sma20 ? 1 : -1, sma20 >= sma50 ? 1 : -1, sma50 >= sma200 ? 1 : -1, ema12 >= ema26 ? 1 : -1];
  const raw = components.reduce((sum, value) => sum + value, 0) / components.length;
  const slopeWindow = clean.slice(-20); const slope = slopeWindow.length > 1 ? (slopeWindow.at(-1) / slopeWindow[0] - 1) / slopeWindow.length : 0;
  const score = clamp(50 + raw * 32 + Math.tanh(slope * 100) * 18, 0, 100);
  return Object.freeze({ score: round(score, 2), strength: round(Math.abs(score - 50) * 2, 2), direction: score >= 56 ? 'BULLISH' : score <= 44 ? 'BEARISH' : 'NEUTRAL', crossover: crossover(clean, 20, 50), averages: Object.freeze({ price, sma20, sma50, sma200, ema12, ema26 }) });
}
