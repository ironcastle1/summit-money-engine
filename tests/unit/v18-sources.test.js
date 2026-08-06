import test from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from '../../src/infra/cache/ttl-cache.js';
import { NwsAlertsSource } from '../../src/sources/nws-alerts-source.js';
import { UkFloodSource } from '../../src/sources/uk-flood-source.js';
import { ReliefWebDisasterSource } from '../../src/sources/reliefweb-disaster-source.js';
import { NdbcSource, parseNdbcLatest } from '../../src/shipping-sources/ndbc-source.js';
import { FredMarketService } from '../../src/services/fred-market-service.js';
import { MapTileService } from '../../src/services/map-tile-service.js';

const logger = { child() { return this; }, warn() {}, info() {}, debug() {}, error() {} };
const sourceOptions = http => ({ http, cache: new TtlCache(), logger, refreshMs: 1_000, staleMs: 1_000 });

test('NWS scraper normalizes polygon alerts and severity', async () => {
  const http = { async json() { return { features: [{ id: 'nws-1', geometry: { type: 'Polygon', coordinates: [[[-80, 30], [-79, 30], [-79, 31], [-80, 31], [-80, 30]]] }, properties: { headline: 'Severe thunderstorm warning', event: 'Severe Thunderstorm Warning', severity: 'Severe', urgency: 'Immediate', certainty: 'Observed', onset: '2026-08-03T12:00:00Z', sent: '2026-08-03T11:55:00Z', updated: '2026-08-03T12:01:00Z', expires: '2026-08-03T14:00:00Z', areaDesc: 'Test County', senderName: 'NWS Test' } }] }; } };
  const result = await new NwsAlertsSource(sourceOptions(http)).load();
  assert.equal(result.health.state, 'ONLINE');
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].category, 'storm');
  assert.equal(result.events[0].severity, 5);
  assert.ok(result.events[0].lat > 30 && result.events[0].lat < 31);
});

test('UK Environment Agency scraper maps flood warnings', async () => {
  const http = { async json() { return { items: [{ '@id': 'https://environment.data.gov.uk/flood-monitoring/id/floods/test', floodAreaID: 'test-area', description: 'Flood warning for River Test', severity: 'Flood Warning', severityLevel: 2, timeRaised: '2026-08-03T10:00:00Z', timeMessageChanged: '2026-08-03T11:00:00Z', message: 'Flooding is expected', floodArea: { lat: 51.1, long: -1.2, riverOrSea: 'River Test', county: 'Testshire' } }] }; } };
  const result = await new UkFloodSource(sourceOptions(http)).load();
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].category, 'flood');
  assert.equal(result.events[0].severity, 4);
  assert.equal(result.events[0].lat, 51.1);
});

test('ReliefWeb disaster scraper maps global disaster records', async () => {
  const http = { async json(url) { assert.match(String(url), /appname=merlin/); return { data: [{ id: 123, fields: { name: 'Test Flood', status: 'ongoing', type: [{ name: 'Flood' }], primary_country: { name: 'Testland', location: { lat: 10.5, lon: 20.5 } }, date: { created: '2026-08-02T00:00:00Z', changed: '2026-08-03T00:00:00Z' }, url: 'https://reliefweb.int/disaster/test' } }] }; } };
  const result = await new ReliefWebDisasterSource({ ...sourceOptions(http), appName: 'merlin', enabled: true }).load();
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].category, 'flood');
  assert.equal(result.events[0].country, 'Testland');
});

test('NDBC scraper parses marine observations used by ports', async () => {
  const text = '#YY MM DD hh mm WDIR WSPD GST WVHT DPD APD MWD PRES ATMP WTMP DEWP VIS TIDE\n#yr mo dy hr mn degT m/s m/s m sec sec degT hPa degC degC degC nmi ft\n26 08 03 12 00 270 8.2 11.1 1.8 7 5 260 1012.3 18.4 17.8 15.0 10.0 1.2\n';
  const parsed = parseNdbcLatest(text);
  assert.equal(parsed.windDirectionDegrees, 270);
  assert.equal(parsed.waveHeightMetres, 1.8);
  const source = new NdbcSource({ http: { async text() { return text; } }, cache: new TtlCache(), logger, enabled: true });
  const result = await source.marineConditions({ id: 'port-london-gateway' });
  assert.equal(result.value.stationId, '62103');
  assert.equal(result.value.windSpeedMetresPerSecond, 8.2);
});

test('FRED scraper returns dated macro readings and changes', async () => {
  const http = { async text(url) { const id = new URL(url).searchParams.get('id'); return `DATE,${id}\n2026-08-01,100\n2026-08-02,102\n`; } };
  const service = new FredMarketService({ http, cache: new TtlCache(), logger });
  const result = await service.snapshot();
  assert.equal(result.records.length, 6);
  assert.equal(result.records[0].value, 102);
  assert.ok(Math.abs(result.records[0].changePercent - 2) < 1e-9);
  assert.equal(result.records[0].state, 'ONLINE');
});

test('map tile service validates, caches and returns image bytes', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return new Response(Buffer.alloc(256, 7), { status: 200, headers: { 'content-type': 'image/png' } });
  };
  try {
    const service = new MapTileService({ cache: new TtlCache(), logger, timeoutMs: 1_000 });
    const first = await service.tile({ style: 'streets', z: 4, x: 8, y: 5 });
    const second = await service.tile({ style: 'streets', z: 4, x: 8, y: 5 });
    assert.equal(first.contentType, 'image/png');
    assert.equal(first.body.length, 256);
    assert.equal(second.cache, 'HIT');
    assert.equal(requests, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
