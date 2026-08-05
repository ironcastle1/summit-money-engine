import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeConflictEvent
}
from '../../src/conflict-intelligence/conflict-event-normalizer.js';
import {
  rawEvents
}
from './fixtures.js';
test('conflict events normalize type actors weapons and evidence',
() => {
  const event = normalizeConflictEvent(rawEvents[0],
  new Date('2026-08-04T12:00:00Z').getTime());
  assert.equal(event.type,
  'MISSILE_STRIKE');
  assert.equal(event.crossBorder,
  true);
  assert.ok(event.actors.length >= 2);
  assert.ok(event.weapons.includes('MISSILE'));
  assert.ok(['A', 'B'].includes(event.evidence.grade));
  assert.ok(event.evidence.score >= 80);
});
test('invalid coordinates are rejected',
() => assert.equal(normalizeConflictEvent({
  ...rawEvents[0],
  lat: NaN
}),
null));
