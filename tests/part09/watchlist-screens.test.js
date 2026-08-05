import test from 'node:test';
import assert from 'node:assert/strict';
import { MarketWatchlist } from '../../src/market-intelligence/watchlist.js';
import { evaluateMarketAlerts } from '../../src/market-intelligence/alert-evaluator.js';
import { MarketScreenRepository } from '../../src/market-intelligence/screen-repository.js';
test('watchlist adds lists and removes watches by owner', async () => {
  const list = new MarketWatchlist();
  const watch = await list.add('owner', { symbol: 'OIL', assetId: 'oil' });
  assert.equal((await list.list('owner')).length, 1);
  assert.equal(await list.remove('owner', watch.id), true);
});
test('alert evaluator produces quantified reasons', () => {
  const alerts = evaluateMarketAlerts([{ id: 'oil', assetId: 'oil', symbol: 'OIL', minimumOpportunity: 60, maximumRisk: 75, minimumMovePercent: 2, directions: [] }], [{ asset: { id: 'oil', symbol: 'OIL' }, quote: { changePercent: 3 }, opportunity: { score: 80, direction: 'BULLISH' }, risk: { score: 20 } }]);
  assert.equal(alerts.length, 1);
  assert.ok(alerts[0].reasons.length >= 2);
});
test('screen repository persists normalized filters', async () => {
  const repository = new MarketScreenRepository();
  const screen = await repository.save('owner', { name: 'Strong liquid', filters: { minimumOpportunity: 70, minimumLiquidity: 60 } });
  assert.equal(screen.filters.minimumOpportunity, 70);
  assert.equal((await repository.list('owner')).length, 1);
  assert.equal(await repository.remove('owner', screen.id), true);
});
