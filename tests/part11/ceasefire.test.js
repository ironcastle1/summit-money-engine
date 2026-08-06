import test from 'node:test';
import assert from 'node:assert/strict';
import {
  conflictEvents
}
from '../../src/conflict-intelligence/conflict-event-normalizer.js';
import {
  ceasefireStatus
}
from '../../src/conflict-intelligence/ceasefire-monitor.js';
import {
  rawEvents
}
from './fixtures.js';
test('ceasefire monitor identifies violation records',
() => {
  const status = ceasefireStatus(conflictEvents(rawEvents));
  assert.equal(status.violationCount,
  1);
});
