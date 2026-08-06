import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMomentum } from '../../src/market-intelligence/momentum-model.js';
import { calculateTrend } from '../../src/market-intelligence/trend-model.js';
import { calculateVolatility } from '../../src/market-intelligence/volatility-model.js';
import { calculateDrawdown } from '../../src/market-intelligence/drawdown-model.js';
import { calculateLiquidity } from '../../src/market-intelligence/liquidity-model.js';
import { candles } from './fixtures.js';
test('positive drift produces bullish trend and momentum', () => {
  const series = candles({ drift: 0.004, volatility: 0.001 });
  const prices = series.map(item => item.close);
  assert.equal(calculateMomentum(prices).direction, 'BULLISH');
  assert.equal(calculateTrend(prices).direction, 'BULLISH');
});
test('volatility model detects expansion and ATR', () => {
  const series = [...candles({ count: 180, volatility: 0.002 }), ...candles({ count: 30, start: 160, volatility: 0.04 })];
  const result = calculateVolatility(series);
  assert.ok(result.atr > 0);
  assert.ok(result.realizedAnnual > 0);
});
test('drawdown reports current and maximum loss', () => {
  const result = calculateDrawdown([100, 120, 90, 110]);
  assert.equal(result.maximumPercent, -25);
  assert.ok(result.currentPercent < 0);
});
test('liquidity score is bounded and reports dollar volume', () => {
  const result = calculateLiquidity(candles(), { price: 100, bid: 99.9, ask: 100.1 });
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.ok(result.averageDollarVolume > 0);
});
