import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TtlCache } from '../../src/infra/cache/ttl-cache.js';
import { ShippingCatalogService } from '../../src/services/shipping-catalog-service.js';
import { ShippingIntelligenceService } from '../../src/services/shipping-intelligence-service.js';
import { TradeFlowService } from '../../src/services/trade-flow-service.js';
import { CommodityShippingService } from '../../src/services/commodity-shipping-service.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let catalog;
test.before(async () => { catalog = await ShippingCatalogService.create({ portsPath: path.join(root,'data/ports.json'), chokepointsPath: path.join(root,'data/chokepoints.json'), commoditiesPath: path.join(root,'data/shipping-commodities.json'), routesPath: path.join(root,'data/routes.json') }); });

test('shipping catalogue loads ports, chokepoints, routes, and commodities', () => {
  const summary = catalog.summary(); assert.ok(summary.ports >= 70); assert.equal(summary.chokepoints, 16); assert.equal(summary.routes, 15); assert.equal(summary.commodities, 11);
  assert.equal(catalog.port('rotterdam').unlocode, 'NLRTM'); assert.equal(catalog.chokepoint('suez-canal').name, 'Suez Canal');
});

test('catalogue filters ports and emits map GeoJSON', () => {
  const ports = catalog.listPorts({ query: 'Rotterdam', commodity: 'containers' }); assert.equal(ports[0].id, 'rotterdam');
  const geojson = catalog.geojson(); assert.equal(geojson.ports.type, 'FeatureCollection'); assert.equal(geojson.ports.features.length, catalog.ports.length);
});

function fakeService() {
  const events = { async globalSnapshot() { return { events: [{ id:'e1',title:'Suez vessel attack',category:'conflict',lat:30.4,lon:32.3,severity:4,time:new Date().toISOString() }], sources:{events:{state:'ONLINE'}} }; } };
  const news = { async search() { return { stories: [{ id:'s1',title:'Suez Canal shipping disruption',latestAt:new Date().toISOString(),verificationScore:80,velocity:{index:70} }], sources:{news:{state:'ONLINE'}} }; } };
  const sources = { health() { return { portwatch:{state:'NOT_CONFIGURED'} }; }, get() { return null; } };
  return new ShippingIntelligenceService({ catalog, events, news, sources, cache: new TtlCache({ maxEntries: 100 }) });
}

test('shipping snapshot ranks location-specific infrastructure risk', async () => {
  const result = await fakeService().snapshot({ hours: 48 });
  const suez = result.chokepoints.find(item => item.id === 'suez-canal'); const panama = result.chokepoints.find(item => item.id === 'panama-canal');
  assert.ok(suez.risk.score > panama.risk.score); assert.equal(result.summary.sources.portwatch.state, 'NOT_CONFIGURED'); assert.equal(result.routes.length, 15);
});

test('shipping point impact uses current node risk map', async () => {
  const result = await fakeService().impactAtPoint({ lat:30.4,lon:32.3 }, 300, { hours:48 });
  assert.ok(result.nearbyChokepoints.some(item => item.id === 'suez-canal')); assert.ok(Number.isFinite(result.score));
});

test('trade flow service computes partner and commodity concentration', async () => {
  const source = { async tradeFlow() { return { value:{records:[{partner:'A',commodity:'Oil',valueUsd:80},{partner:'B',commodity:'Oil',valueUsd:20}]},source:'fake',cache:'MISS',stale:false }; } };
  const service = new TradeFlowService({ sources:{get(){return source;}}, catalog });
  const result = await service.query({period:'2025',reporterCode:'826'}); assert.equal(result.byPartner[0].sharePct,80); assert.ok(result.partnerConcentration.hhi>6000);
});

test('commodity detail leaves unavailable market readings explicit', async () => {
  const shipping = fakeService();
  const markets = { async analyse() { throw Object.assign(new Error('not configured'),{code:'SOURCE_NOT_CONFIGURED'}); } };
  const service = new CommodityShippingService({ catalog, shipping, markets, sources:{get(){return null;}} });
  const result = await service.detail('crude-oil',{hours:48}); assert.ok(Number.isFinite(result.supplyRisk)); assert.equal(result.markets.every(item=>item.error?.code==='SOURCE_NOT_CONFIGURED'),true);
});
