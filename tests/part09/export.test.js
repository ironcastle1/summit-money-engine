import test from 'node:test';
import assert from 'node:assert/strict';
import { MarketIntelligenceExportService } from '../../src/market-intelligence/export-service.js';
import { analyzeAsset } from '../../src/market-intelligence/asset-analyzer.js';
import { assetInput } from './fixtures.js';
test('CSV export contains transparent score columns', () => {
  const service = new MarketIntelligenceExportService();
  const csv = service.toCsv([analyzeAsset(assetInput('oil', { symbol: 'OIL' }))]);
  assert.match(csv, /opportunityScore/);
  assert.match(csv, /riskScore/);
  assert.match(csv, /OIL/);
});
test('summary limits opportunity list and keeps disclosure', () => {
  const service = new MarketIntelligenceExportService();
  const summary = service.summary({ assets: [1], opportunities: Array.from({ length: 20 }, (_, index) => ({ index })) });
  assert.equal(summary.topOpportunities.length, 10);
  assert.match(summary.disclosure, /not investment advice/i);
});
