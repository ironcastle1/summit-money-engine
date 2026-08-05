import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildConflictSnapshot
}
from '../../src/conflict-intelligence/snapshot-builder.js';
import {
  rawEvents
}
from './fixtures.js';
test('snapshot groups events into ranked conflict theatres',
() => {
  const snapshot = buildConflictSnapshot(rawEvents,
  {
    now: new Date('2026-08-04T12:00:00Z').getTime()
  });
  assert.equal(snapshot.theatres.length,
  2);
  assert.equal(snapshot.theatres[0].id,
  'example-war');
  assert.ok(snapshot.theatres[0].risk.score > snapshot.theatres[1].risk.score);
  assert.equal(snapshot.features.type,
  'FeatureCollection');
});
