import { clamp, mean, percentile, round, standardDeviation } from './numbers.js';
import { returnSeries } from './returns.js';
export function averageTrueRange(series = [], period = 14) {
  const ranges = [];
  for (let index = 1; index < series.length; index += 1) {
    const current = series[index]; const previous = series[index - 1];
    ranges.push(Math.max(current.high - current.low, Math.abs(current.high - previous.close), Math.abs(current.low - previous.close)));
  }
  return round(mean(ranges.slice(-period)), 8);
}
export function calculateVolatility(series = [], periodsPerYear = 252) {
  const prices = series.map(point => Number(point.close)).filter(value => Number.isFinite(value) && value > 0);
  const returns = returnSeries(prices); const recent = returns.slice(-20); const baseline = returns.slice(-120);
  const realized = standardDeviation(recent) * Math.sqrt(periodsPerYear);
  const baselineVol = standardDeviation(baseline) * Math.sqrt(periodsPerYear);
  const expansion = baselineVol ? realized / baselineVol : 1;
  const downside = standardDeviation(recent.filter(value => value < 0)) * Math.sqrt(periodsPerYear);
  const atr = averageTrueRange(series); const price = prices.at(-1) || 0; const atrPercent = price ? atr / price * 100 : 0;
  const score = clamp(25 + realized * 110 + Math.max(0, expansion - 1) * 25, 0, 100);
  return Object.freeze({ realizedAnnual: round(realized * 100, 3), downsideAnnual: round(downside * 100, 3), baselineAnnual: round(baselineVol * 100, 3), expansion: round(expansion, 3), atr, atrPercent: round(atrPercent, 3), tailMove: round(Math.abs(percentile(returns, 0.05)) * 100, 3), score: round(score, 2), state: score >= 75 ? 'EXTREME' : score >= 55 ? 'ELEVATED' : score <= 25 ? 'QUIET' : 'NORMAL' });
}
