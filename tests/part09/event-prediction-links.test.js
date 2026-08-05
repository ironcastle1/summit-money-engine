import test from 'node:test';
import assert from 'node:assert/strict';
import { linkEventToAssets } from '../../src/market-intelligence/event-market-linker.js';
import { linkPredictionMarkets } from '../../src/market-intelligence/prediction-linker.js';
import { calculatePredictionDivergence } from '../../src/market-intelligence/prediction-divergence.js';
import { asset, majorEvent, prediction } from './fixtures.js';
test('energy disruption links to an oil asset', () => {
  const links = linkEventToAssets(majorEvent, [asset('brent', { symbol: 'BRENT', tags: ['oil', 'energy', 'shipping'] })]);
  assert.equal(links.length, 1);
  assert.ok(links[0].relevance >= 35);
});
test('unrelated asset is not forced into event links', () => {
  const links = linkEventToAssets({ id: 'x', title: 'Local art exhibition opens', tags: ['art'] }, [asset('btc', { tags: ['crypto'] })]);
  assert.equal(links.length, 0);
});
test('prediction market links by semantic subject', () => {
  const links = linkPredictionMarkets([prediction], [asset('oil', { name: 'Oil futures', tags: ['oil', 'energy'] })]);
  assert.ok(links.length >= 1);
});
test('prediction divergence compares probability and technical signal', () => {
  const result = calculatePredictionDivergence({ id: 'oil', momentum: { score: 25 } }, [{ assetId: 'oil', probability: 80, relevance: 70 }]);
  assert.ok(result.score > 50);
  assert.equal(result.direction, 'PREDICTION_MORE_BULLISH');
});
