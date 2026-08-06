import test from 'node:test';
import assert from 'node:assert/strict';
import { commodityGroup, commodityTags } from '../../src/market-intelligence/commodity-taxonomy.js';
import { calculateCommodityBalance } from '../../src/market-intelligence/commodity-balance.js';
import { inventoryPressure } from '../../src/market-intelligence/inventory-pressure.js';
import { scoreSupplyDemandShock } from '../../src/market-intelligence/supply-demand-shock.js';
test('commodity taxonomy recognises energy and grains', () => {
  assert.equal(commodityGroup('Brent crude oil'), 'ENERGY');
  assert.equal(commodityGroup('Chicago wheat'), 'GRAINS');
  assert.equal(commodityTags({ assetClass: 'commodity', tags: ['gold'] }).group, 'PRECIOUS_METALS');
});
test('commodity deficit produces tight balance', () => {
  const result = calculateCommodityBalance({ production: 90, imports: 5, consumption: 100, exports: 5, stocks: 1 });
  assert.ok(result.tightness > 50);
  assert.ok(result.balance < 0);
});
test('falling inventory raises pressure score', () => {
  const result = inventoryPressure([100, 95, 90, 80, 70]);
  assert.ok(result.score > 50);
});
test('supply loss and low buffers create high shock severity', () => {
  const result = scoreSupplyDemandShock({ supplyChangePercent: -15, demandChangePercent: 2, inventoryDays: 10, spareCapacityPercent: 1, durationDays: 30, substitutionScore: 5 });
  assert.ok(result.severity >= 65);
  assert.equal(result.direction, 'TIGHTENING');
});
