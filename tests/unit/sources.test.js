import test from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from '../../src/infra/cache/ttl-cache.js';
import { UsgsSource } from '../../src/sources/usgs-source.js';
import { EonetSource } from '../../src/sources/eonet-source.js';
import { GdacsSource } from '../../src/sources/gdacs-source.js';

const logger = { child: () => ({ warn() {}, info() {}, debug() {}, error() {} }) };
const options = http => ({ http, cache: new TtlCache(), logger, refreshMs: 1000, staleMs: 1000 });

test('USGS adapter normalizes GeoJSON features', async () => {
  const http = { json: async () => ({ features: [{ id: 'us1', geometry: { coordinates: [2, 51, 10] }, properties: { title: 'M 4.5 test', mag: 4.5, time: Date.now(), updated: Date.now(), url: 'https://example.com', tsunami: 0, sig: 300 } }] }) };
  const result = await new UsgsSource(options(http)).load();
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].category, 'earthquake');
  assert.equal(result.health.state, 'ONLINE');
});

test('EONET adapter selects the latest point geometry', async () => {
  const http = { json: async () => ({ events: [{ id: 'eo1', title: 'Storm', categories: [{ id: 'severeStorms' }], geometry: [{ type: 'Point', coordinates: [1, 2], date: '2026-07-01T00:00:00Z' }, { type: 'Point', coordinates: [3, 4], date: '2026-07-02T00:00:00Z' }], sources: [{ url: 'https://example.com' }] }] }) };
  const result = await new EonetSource(options(http)).load();
  assert.equal(result.events[0].lat, 4);
  assert.equal(result.events[0].lon, 3);
  assert.equal(result.events[0].category, 'storm');
});

test('GDACS adapter parses RSS records', async () => {
  const xml = '<rss><channel><item><title>Flood X</title><guid>g1</guid><link>https://example.com</link><pubDate>Wed, 29 Jul 2026 12:00:00 GMT</pubDate><georss:point>10 20</georss:point><gdacs:eventtype>FL</gdacs:eventtype><gdacs:alertlevel>Orange</gdacs:alertlevel><gdacs:country>Test</gdacs:country></item></channel></rss>';
  const http = { text: async () => xml };
  const result = await new GdacsSource(options(http)).load();
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].category, 'flood');
  assert.equal(result.events[0].alertLevel, 'Orange');
});
