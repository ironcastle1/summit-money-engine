import { clamp, round } from './numbers.js';
import { simpleReturn } from './returns.js';
function horizon(prices, bars) {
  if (prices.length < 2) return 0;
  return simpleReturn(prices[Math.max(0, prices.length - 1 - bars)], prices.at(-1));
}
export function calculateMomentum(prices = []) {
  const clean = prices.map(Number).filter(value => Number.isFinite(value) && value > 0);
  const returns = { one: horizon(clean, 1), five: horizon(clean, 5), twenty: horizon(clean, 20), sixty: horizon(clean, 60) };
  const composite = returns.one * 0.1 + returns.five * 0.2 + returns.twenty * 0.35 + returns.sixty * 0.35;
  const score = clamp(50 + Math.tanh(composite * 5) * 50, 0, 100);
  return Object.freeze({
    returns: Object.freeze(Object.fromEntries(Object.entries(returns).map(([key, value]) => [key, round(value * 100, 4)]))),
    composite: round(composite * 100, 4), score: round(score, 2),
    direction: score >= 57 ? 'BULLISH' : score <= 43 ? 'BEARISH' : 'NEUTRAL'
  });
}
