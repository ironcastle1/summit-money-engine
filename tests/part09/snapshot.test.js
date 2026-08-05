import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMarketSnapshot } from '../../src/market-intelligence/snapshot-builder.js';
import { analyzeAsset } from '../../src/market-intelligence/asset-analyzer.js';
import { assetInput } from './fixtures.js';
test('snapshot includes breadth regime heatmap correlations and map features', () => {
  const assets = [analyzeAsset(assetInput('oil', { symbol: 'OIL' })), analyzeAsset(assetInput('gas', { symbol: 'GAS', drift: -0.001 }))];
  const snapshot = buildMarketSnapshot({ assets });
  assert.equal(snapshot.assets.length, 2);
  assert.ok(snapshot.breadth);
  assert.ok(snapshot.regime);
  assert.equal(snapshot.mapFeatures.features.length, 2);
  assert.equal(snapshot.correlations.labels.length, 2);
});
test('snapshot disclosure is explicit', () => {
  const snapshot = buildMarketSnapshot({ assets: [] });
  assert.match(snapshot.disclosure, /not investment advice/i);
});
