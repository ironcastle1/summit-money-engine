import test from 'node:test';
import assert from 'node:assert/strict';
import { betaPosterior, betaQuantile } from '../../src/domain/scoring/beta.js';
import { analyzeRadius } from '../../src/domain/scoring/radius-analysis.js';
import { createEvent } from '../../src/domain/events/event-schema.js';
import { SOURCE_STATES, sourceHealth } from '../../src/sources/source-status.js';

const now = Date.UTC(2026, 6, 29, 12);
const sources = {
  usgs: { id: 'usgs', ...sourceHealth(SOURCE_STATES.ONLINE, { configured: true, weight: 1, recordCount: 10 }) },
  eonet: { id: 'eonet', ...sourceHealth(SOURCE_STATES.ONLINE, { configured: true, weight: 1, recordCount: 10 }) },
  acled: { id: 'acled', ...sourceHealth(SOURCE_STATES.NOT_CONFIGURED, { configured: false, weight: 1.2 }) }
};

function makeEvent(index, overrides = {}) {
  return createEvent({
    source: index % 2 ? 'USGS' : 'NASA EONET',
    sourceId: `event-${index}`,
    title: `Event ${index}`,
    category: index % 2 ? 'earthquake' : 'storm',
    lat: 51.5 + index * 0.01,
    lon: -0.1 + index * 0.01,
    time: now - index * 24 * 3_600_000,
    severity: 1 + index % 4,
    ...overrides
  });
}

test('beta posterior returns bounded estimate and interval', () => {
  const posterior = betaPosterior(8, 30);
  assert.ok(posterior.mean > 0 && posterior.mean < 1);
  assert.ok(posterior.interval90[0] < posterior.mean);
  assert.ok(posterior.interval90[1] > posterior.mean);
  assert.ok(betaQuantile(0.5, 2, 2) > 0.49 && betaQuantile(0.5, 2, 2) < 0.51);
});

test('radius analysis returns location-specific metrics', () => {
  const local = Array.from({ length: 14 }, (_, index) => makeEvent(index));
  const remote = Array.from({ length: 8 }, (_, index) => makeEvent(index + 40, { lat: 35.6, lon: 139.7 }));
  const london = analyzeRadius({ events: [...local, ...remote], sources, lat: 51.5074, lon: -0.1278, radiusKm: 250, now });
  const tokyo = analyzeRadius({ events: [...local, ...remote], sources, lat: 35.6762, lon: 139.6503, radiusKm: 250, now });
  assert.equal(london.metrics.eventCount30d, 14);
  assert.equal(tokyo.metrics.eventCount30d, 0);
  assert.notEqual(london.metrics.eventProbability24h, tokyo.metrics.eventProbability24h);
  assert.ok(london.metrics.confidencePct > tokyo.metrics.confidencePct);
});

test('low-sample radius returns a bounded prior-adjusted estimate when sources are online', () => {
  const result = analyzeRadius({ events: [makeEvent(0)], sources, lat: 51.5, lon: -0.1, radiusKm: 50, now });
  assert.ok(Number.isFinite(result.metrics.eventProbability24h));
  assert.ok(result.metrics.eventProbability24h > 0 && result.metrics.eventProbability24h < 20);
  assert.ok(result.metrics.probabilityRange90.every(Number.isFinite));
  assert.equal(result.metrics.estimateSupported, true);
});

test('radius probability remains unavailable when configured feeds have no coverage', () => {
  const offlineSources = {
    usgs: { id: 'usgs', ...sourceHealth(SOURCE_STATES.OFFLINE, { configured: true, weight: 1 }) }
  };
  const result = analyzeRadius({ events: [], sources: offlineSources, lat: 51.5, lon: -0.1, radiusKm: 50, now });
  assert.equal(result.metrics.eventProbability24h, null);
  assert.deepEqual(result.metrics.probabilityRange90, [null, null]);
  assert.equal(result.metrics.estimateSupported, false);
});
