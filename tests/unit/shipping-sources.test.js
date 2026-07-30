import test from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from '../../src/infra/cache/ttl-cache.js';
import { NoaaCoopsSource } from '../../src/shipping-sources/noaa-coops-source.js';
import { ImfPortWatchSource } from '../../src/shipping-sources/imf-portwatch-source.js';
import { UnComtradeSource } from '../../src/shipping-sources/un-comtrade-source.js';
import { EiaShippingSource } from '../../src/shipping-sources/eia-source.js';
import { ShippingSourceRegistry } from '../../src/shipping-sources/registry.js';

const logger = { child() { return this; }, warn() {} };
const port = { id: 'new-york', noaaStation: '8518750' };

test('NOAA source compares observed levels with predictions', async () => {
  const http = { async json(url) { return String(url).includes('product=predictions') ? { predictions: [{ t: 'x', v: '1.0' }, { t: 'y', v: '1.2' }] } : { data: [{ t: 'x', v: '1.4' }, { t: 'y', v: '1.6' }] }; } };
  const source = new NoaaCoopsSource({ http, cache: new TtlCache(), logger, enabled: true });
  const result = await source.portConditions(port);
  assert.equal(result.value.sampleSize, 2); assert.equal(result.value.waterLevelAnomalyMetres, 0.4); assert.equal(source.health().state, 'ONLINE');
});

test('NOAA source rejects ports without a station', async () => {
  const source = new NoaaCoopsSource({ http: {}, cache: new TtlCache(), logger, enabled: true });
  await assert.rejects(() => source.portConditions({ id: 'x' }), error => error.code === 'STATION_NOT_AVAILABLE');
});

test('PortWatch is NOT_CONFIGURED without an API layer URL', () => {
  const source = new ImfPortWatchSource({ http: {}, cache: new TtlCache(), logger, baseUrl: '' });
  assert.equal(source.health().state, 'NOT_CONFIGURED'); assert.equal(source.supports('PORT_ACTIVITY'), false);
});

test('PortWatch adapter maps flexible activity fields', async () => {
  const http = { async json() { return { features: [{ attributes: { date: '2026-07-01', portcalls: 50, portcalls_change: -12, trade: 2000, trade_change: -8, waiting_change: 20 } }] }; } };
  const source = new ImfPortWatchSource({ http, cache: new TtlCache(), logger, baseUrl: 'https://example.test/query' });
  const result = await source.portActivity({ id: 'port0', portwatchId: 'port0' });
  assert.equal(result.value.calls, 50); assert.equal(result.value.callsChangePct, -12); assert.equal(result.value.waitingTimeChangePct, 20);
});

test('UN Comtrade adapter normalizes public trade rows', async () => {
  let requested;
  const http = { async json(url) { requested = String(url); return { data: [{ period: '2025', reporterDesc: 'UK', partnerDesc: 'USA', flowDesc: 'Export', cmdCode: '2709', cmdDesc: 'Crude', primaryValue: 1000, netWgt: 20 }] }; } };
  const source = new UnComtradeSource({ http, cache: new TtlCache(), logger, enabled: true });
  const result = await source.tradeFlow({ period: '2025', reporterCode: '826', flowCode: 'X', commodityCode: '2709' });
  assert.equal(result.value.records[0].valueUsd, 1000); assert.match(requested, /reporterCode=826/); assert.match(requested, /cmdCode=2709/);
});

test('EIA source remains NOT_CONFIGURED until key and route are supplied', () => {
  const source = new EiaShippingSource({ http: {}, cache: new TtlCache(), logger, apiKey: '', routeUrl: '' });
  assert.equal(source.health().state, 'NOT_CONFIGURED');
});

test('shipping registry returns first successful capable source', async () => {
  const first = { id: 'a', supports: () => true, portActivity: async () => { throw Object.assign(new Error('down'), { code: 'DOWN' }); }, health: () => ({ state: 'OFFLINE' }) };
  const second = { id: 'b', supports: () => true, portActivity: async () => ({ value: { calls: 10 } }), health: () => ({ state: 'ONLINE' }) };
  const registry = new ShippingSourceRegistry({ logger }).register(first).register(second);
  const result = await registry.first('PORT_ACTIVITY', 'portActivity', { id: 'x' });
  assert.equal(result.value.calls, 10); assert.equal(registry.capable('PORT_ACTIVITY').length, 2);
});
