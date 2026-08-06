import test from 'node:test';
import assert from 'node:assert/strict';
import {
  conflictEvents
}
from '../../src/conflict-intelligence/conflict-event-normalizer.js';
import {
  verificationGap
}
from '../../src/conflict-intelligence/verification-gap.js';
import {
  conflictContradictions
}
from '../../src/conflict-intelligence/contradiction-analysis.js';
import {
  rawEvents
}
from './fixtures.js';
test('verification analysis remains explainable',
() => {
  const events = conflictEvents(rawEvents),
  gap = verificationGap(events),
  contradictions = conflictContradictions(events);
  assert.ok(gap.score >= 0 && gap.score <= 100);
  assert.ok(Array.isArray(contradictions.items));
});
