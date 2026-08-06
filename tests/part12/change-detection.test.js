import test from 'node:test';
import assert from 'node:assert/strict';
import { detectChanges } from '../../src/decision-support/change-detector.js';
test('change detector identifies new escalation de-escalation and removal', () => {
  const previous = [{ id: 'a', attention: { score: 40 } }, { id: 'b', attention: { score: 80 } }, { id: 'gone', attention: { score: 50 } }];
  const current = [{ id: 'a', attention: { score: 60 } }, { id: 'b', attention: { score: 60 } }, { id: 'new', attention: { score: 70 } }];
  const changes = detectChanges(current, previous);
  assert.equal(changes.added.length, 1);
  assert.equal(changes.escalated.length, 1);
  assert.equal(changes.deescalated.length, 1);
  assert.equal(changes.removed.length, 1);
});
