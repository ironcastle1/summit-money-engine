import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQuote } from '../../src/market-intelligence/quote-normalizer.js';
import { normalizeSeries } from '../../src/market-intelligence/series-normalizer.js';
import { normalizeScreenRequest, normalizeSnapshotRequest } from '../../src/market-intelligence/validation.js';
test('quote normalizer calculates change percent', () => {
  const quote = normalizeQuote({ price: 110, previousClose: 100, timestamp: 1_700_000_000 }, { id: 'x', symbol: 'X' });
  assert.equal(quote.changePercent, 10);
  assert.equal(quote.assetId, 'x');
});
test('series normalizer sorts and deduplicates timestamps', () => {
  const series = normalizeSeries([{ timestamp: 2, open: 2, high: 3, low: 1, close: 2 }, { timestamp: 1, open: 1, high: 2, low: 0.5, close: 1 }, { timestamp: 2, open: 2, high: 4, low: 1, close: 3 }]);
  assert.equal(series.length, 2);
  assert.equal(series.at(-1).close, 3);
});
test('snapshot request only accepts string assets as ids', () => {
  const structured = normalizeSnapshotRequest({ assets: [{ id: 'x' }] });
  const ids = normalizeSnapshotRequest({ assets: ['x', 'y'] });
  assert.deepEqual(structured.assetIds, []);
  assert.deepEqual(ids.assetIds, ['x', 'y']);
});
test('screen request bounds scores and limits', () => {
  const request = normalizeScreenRequest({ minimumOpportunity: 110, maximumRisk: -3, limit: 9000 });
  assert.equal(request.minimumOpportunity, 100);
  assert.equal(request.maximumRisk, 0);
  assert.equal(request.limit, 500);
});
