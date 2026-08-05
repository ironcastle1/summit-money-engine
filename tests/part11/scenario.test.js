import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildConflictSnapshot
}
from '../../src/conflict-intelligence/snapshot-builder.js';
import {
  runConflictScenario
}
from '../../src/conflict-intelligence/scenario-engine.js';
import {
  rawEvents
}
from './fixtures.js';
const theatre = buildConflictSnapshot(rawEvents).theatres[0];
test('adverse conflict scenario increases risk',
() => {
  const result = runConflictScenario(theatre,
  {
    type: 'STRATEGIC_STRIKE',
    severity: 80,
    horizonDays: 30
  });
  assert.ok(result.after > result.before);
});
test('ceasefire scenario decreases risk',
() => {
  const result = runConflictScenario(theatre,
  {
    type: 'CEASEFIRE',
    severity: 80,
    horizonDays: 30
  });
  assert.ok(result.after < result.before);
});
