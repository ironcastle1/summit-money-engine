import test from 'node:test';
import assert from 'node:assert/strict';
import {
  conflictEvents
}
from '../../src/conflict-intelligence/conflict-event-normalizer.js';
import {
  escalationScore
}
from '../../src/conflict-intelligence/escalation-score.js';
import {
  rawEvents
}
from './fixtures.js';
test('cross-border strategic strikes and violations raise escalation',
() => {
  const score = escalationScore(conflictEvents(rawEvents));
  assert.ok(score.score >= 45);
  assert.ok(score.indicators.crossBorder >= 1);
  assert.ok(score.indicators.ceasefireViolations >= 1);
});
