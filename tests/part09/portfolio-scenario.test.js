import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeAsset } from '../../src/market-intelligence/asset-analyzer.js';
import { calculatePortfolioExposure } from '../../src/market-intelligence/portfolio-exposure.js';
import { runMarketScenario } from '../../src/market-intelligence/scenario-engine.js';
import { runSensitivityAnalysis } from '../../src/market-intelligence/sensitivity-analysis.js';
import { assetInput } from './fixtures.js';
const analyses = [analyzeAsset(assetInput('oil', { symbol: 'OIL', assetClass: 'commodity' })), analyzeAsset(assetInput('gold', { symbol: 'GOLD', assetClass: 'commodity', tags: ['gold'] }))];
const positions = [{ assetId: 'oil', symbol: 'OIL', marketValue: 10000 }, { assetId: 'gold', symbol: 'GOLD', marketValue: 5000 }];
test('portfolio exposure calculates weights and concentration', () => {
  const result = calculatePortfolioExposure(positions, analyses);
  assert.equal(result.grossValue, 15000);
  assert.equal(result.positions.length, 2);
  assert.ok(result.concentrationIndex > 0);
});
test('scenario applies class shock to matching positions', () => {
  const result = runMarketScenario({ positions, shocks: [{ targetType: 'ASSET_CLASS', target: 'commodity', changePercent: -10 }] }, analyses);
  assert.equal(result.pnl, -1500);
  assert.equal(result.pnlPercent, -10);
});
test('sensitivity returns requested number of points', () => {
  const result = runSensitivityAnalysis({ positions, targetType: 'ASSET_CLASS', target: 'commodity', minimumPercent: -10, maximumPercent: 10, steps: 5 }, analyses);
  assert.equal(result.points.length, 5);
  assert.ok(result.downside.portfolioPnl < 0);
});
