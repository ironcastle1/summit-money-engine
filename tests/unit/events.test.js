import test from 'node:test';
import assert from 'node:assert/strict';
import { createEvent } from '../../src/domain/events/event-schema.js';
import { deduplicateEvents } from '../../src/domain/events/event-deduper.js';
import { clusterEvents } from '../../src/domain/events/event-clusterer.js';

const now = Date.now();
function event(overrides = {}) {
  return createEvent({
    source: 'TEST', sourceId: overrides.sourceId || crypto.randomUUID(), title: 'Magnitude 5 earthquake near Test City',
    category: 'earthquake', lat: 51.5, lon: -0.1, time: now, severity: 3, ...overrides
  });
}

test('event schema normalizes fields and creates stable identifiers', () => {
  const first = createEvent({ source: 'USGS', sourceId: 'abc', title: ' Event   title ', category: 'earthquakes', lat: '51.5', lon: '-0.1', time: now, severity: 9 });
  const second = createEvent({ source: 'USGS', sourceId: 'abc', title: 'Different title', category: 'earthquake', lat: 51.5, lon: -0.1, time: now, severity: 2 });
  assert.equal(first.id, second.id);
  assert.equal(first.category, 'earthquake');
  assert.equal(first.title, 'Event title');
  assert.equal(first.severity, 5);
  assert.ok(Object.isFrozen(first));
});

test('event schema rejects invalid coordinates and timestamps', () => {
  assert.equal(createEvent({ source: 'X', title: 'Bad', lat: 100, lon: 0, time: now }), null);
  assert.equal(createEvent({ source: 'X', title: 'Bad', lat: 0, lon: 0, time: 'not-a-date' }), null);
});

test('deduplication merges matching cross-source records', () => {
  const events = [
    event({ source: 'USGS', sourceId: 'a', title: 'M 5.0 earthquake near Test City', lat: 51.5, lon: -0.1 }),
    event({ source: 'GDACS', sourceId: 'b', title: 'Magnitude 5 earthquake Test City', lat: 51.52, lon: -0.08, time: now + 30 * 60_000 })
  ];
  const result = deduplicateEvents(events, { distanceKm: 20, timeHours: 2, threshold: 0.45 });
  assert.equal(result.length, 1);
  assert.equal(result[0].attributes.duplicateCount, 1);
  assert.equal(result[0].attributes.sources.length, 2);
});

test('clustering joins nearby matching events but not remote events', () => {
  const events = [
    event({ sourceId: '1', lat: 51.5, lon: -0.1 }),
    event({ sourceId: '2', lat: 51.6, lon: -0.2 }),
    event({ sourceId: '3', lat: 35.6, lon: 139.7 })
  ];
  const clusters = clusterEvents(events, { distanceKm: 50, timeHours: 24 });
  assert.equal(clusters.length, 2);
  assert.equal(Math.max(...clusters.map(cluster => cluster.eventCount)), 2);
});
