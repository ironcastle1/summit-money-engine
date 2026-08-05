import test from 'node:test';
import assert from 'node:assert/strict';
import { runScreen } from '../../src/market-intelligence/screener-engine.js';
function row(id, score, risk, liquidity, grade = 'B', assetClass = 'COMMODITY') { return { asset: { id, symbol: id.toUpperCase(), name: id, assetClass, tags: ['energy'] }, opportunity: { score, direction: 'BULLISH' }, risk: { score: risk }, liquidity: { score: liquidity }, evidence: { grade }, quote: { price: 10, changePercent: 1 } }; }
test('screener filters opportunity risk and liquidity', () => {
  const result = runScreen([row('a', 80, 30, 80), row('b', 50, 20, 90), row('c', 90, 90, 90)], { minimumOpportunity: 70, maximumRisk: 50, minimumLiquidity: 60 });
  assert.deepEqual(result.results.map(item => item.asset.id), ['a']);
});
test('screener filters search and tags', () => {
  const result = runScreen([row('oil', 70, 30, 80), row('gas', 75, 30, 80)], { query: 'oil', tags: ['energy'] });
  assert.equal(result.results.length, 1);
});
test('screener supports ascending sort', () => {
  const result = runScreen([row('a', 80, 30, 80), row('b', 60, 20, 90)], { sortBy: 'riskScore', sortDirection: 'asc' });
  assert.deepEqual(result.results.map(item => item.asset.id), ['b', 'a']);
});
