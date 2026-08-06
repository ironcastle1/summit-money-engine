import test from 'node:test';
import assert from 'node:assert/strict';
import {
  conflictEvents
}
from '../../src/conflict-intelligence/conflict-event-normalizer.js';
import {
  buildFrontlines
}
from '../../src/conflict-intelligence/frontline-builder.js';
import {
  rawEvents
}
from './fixtures.js';
test('frontline builder creates map-ready line geometry',
() => {
  const fronts = buildFrontlines(conflictEvents(rawEvents));
  assert.ok(fronts.length >= 1);
  assert.equal(fronts[0].geometry.type,
  'LineString');
  assert.ok(fronts[0].geometry.coordinates.length >= 1);
});
