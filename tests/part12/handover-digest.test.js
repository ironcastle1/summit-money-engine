import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDecisionSnapshot } from '../../src/decision-support/snapshot-builder.js';
import { buildShiftHandover } from '../../src/decision-support/shift-handover.js';
import { notificationDigest } from '../../src/decision-support/notification-digest.js';
import { fixtureSignals } from './fixtures.js';
test('handover and digest contain priority items', () => {
  const snapshot = buildDecisionSnapshot({ signals: fixtureSignals() });
  const handover = buildShiftHandover(snapshot);
  const digest = notificationDigest(snapshot, { minimumPriority: 50 });
  assert.ok(handover.unresolved.length >= 1);
  assert.ok(digest.items.length >= 1);
});
