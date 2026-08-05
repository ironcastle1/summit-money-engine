import test from 'node:test';
import assert from 'node:assert/strict';
import { correlation, buildCorrelationMatrix } from '../../src/market-intelligence/correlation-matrix.js';
import { calculateBreadth } from '../../src/market-intelligence/breadth-model.js';
import { classifyMarketRegime } from '../../src/market-intelligence/market-regime.js';
import { relativeStrength } from '../../src/market-intelligence/relative-strength.js';
test('correlation identifies aligned return series', () => {
  const left = [1, 2, 3, 4, 5, 6];
  const right = [2, 4, 6, 8, 10, 12];
  assert.ok(correlation(left, right) > 0.99);
});
test('matrix is square and labels assets', () => {
  const matrix = buildCorrelationMatrix([{ id: 'a', prices: [1, 2, 3, 4] }, { id: 'b', prices: [2, 3, 4, 5] }]);
  assert.deepEqual(matrix.labels, ['a', 'b']);
  assert.equal(matrix.matrix.length, 2);
});
test('breadth and regime reflect a broad advance', () => {
  const assets = Array.from({ length: 8 }, () => ({ quote: { changePercent: 2 }, trend: { score: 70 }, momentum: { score: 70 } }));
  const breadth = calculateBreadth(assets);
  const regime = classifyMarketRegime({ breadth, volatility: 25, liquidity: 75 });
  assert.equal(breadth.state, 'BROAD_ADVANCE');
  assert.equal(regime.regime, 'RISK_ON');
});
test('relative strength detects outperformance', () => {
  const result = relativeStrength([100, 101, 103, 108, 115, 125], [100, 101, 102, 103, 104, 105]);
  assert.equal(result.direction, 'OUTPERFORMING');
});
