import test from 'node:test';
import assert from 'node:assert/strict';
import { MarketIntelligencePlatformService } from '../../src/services/market-intelligence-platform-service.js';
import { assetInput, majorEvent, prediction } from './fixtures.js';
function platform() {
  return new MarketIntelligencePlatformService({
    marketCatalog: { list: () => [assetInput('oil').asset], internalList: () => [assetInput('oil').asset] },
    marketData: { bundle: async () => assetInput('oil') },
    marketRegistry: { health: () => [{ id: 'fixture', configured: true }] },
    eventService: { globalSnapshot: async () => ({ events: [majorEvent] }) },
    predictionMarkets: { list: async () => ({ markets: [prediction] }) }
  });
}
test('platform builds supplied snapshot without treating objects as ids', async () => {
  const service = platform();
  const snapshot = await service.snapshot({ assets: [assetInput('oil')], events: [majorEvent], predictionMarkets: [prediction] });
  assert.equal(snapshot.availableAssets, 1);
  assert.ok(snapshot.eventLinks.length >= 1);
});
test('platform live snapshot uses catalog and data service', async () => {
  const service = platform();
  const snapshot = await service.snapshot({ assetIds: ['oil'], maximumAssets: 1, force: true });
  assert.equal(snapshot.availableAssets, 1);
});
test('platform screen portfolio and scenario operate on a supplied snapshot', async () => {
  const service = platform();
  const snapshot = await service.snapshot({ assets: [assetInput('oil')], events: [], predictionMarkets: [] });
  const screen = await service.screen({ snapshot, minimumOpportunity: 0 });
  const portfolio = await service.portfolio({ snapshot, positions: [{ assetId: 'oil', symbol: 'OIL', marketValue: 1000 }] });
  const scenario = await service.scenario({ snapshot, positions: [{ assetId: 'oil', symbol: 'OIL', marketValue: 1000 }], shocks: [{ targetType: 'ASSET_CLASS', target: 'commodity', changePercent: -10 }] });
  assert.equal(screen.results.length, 1);
  assert.equal(portfolio.grossValue, 1000);
  assert.equal(scenario.pnl, -100);
});
test('diagnostics and catalogue expose capabilities', () => {
  const service = platform();
  assert.equal(service.diagnostics().state, 'READY');
  assert.ok(service.catalog().capabilities.includes('scenario-analysis'));
});
