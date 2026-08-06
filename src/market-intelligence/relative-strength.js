import { round } from './numbers.js';
import { simpleReturn } from './returns.js';
function periodReturn(prices, period) {
  if (prices.length < 2) return 0;
  return simpleReturn(prices[Math.max(0, prices.length - 1 - period)], prices.at(-1));
}
export function relativeStrength(assetPrices = [], benchmarkPrices = []) {
  const horizons = [5, 20, 60];
  const details = horizons.map(period => {
    const asset = periodReturn(assetPrices, period); const benchmark = periodReturn(benchmarkPrices, period);
    return Object.freeze({ period, asset: round(asset * 100, 3), benchmark: round(benchmark * 100, 3), excess: round((asset - benchmark) * 100, 3) });
  });
  const composite = details.reduce((sum, item, index) => sum + item.excess * [0.2, 0.35, 0.45][index], 0);
  return Object.freeze({ composite: round(composite, 3), direction: composite > 1 ? 'OUTPERFORMING' : composite < -1 ? 'UNDERPERFORMING' : 'INLINE', horizons: Object.freeze(details) });
}
