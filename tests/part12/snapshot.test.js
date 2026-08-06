import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDecisionSnapshot } from '../../src/decision-support/snapshot-builder.js';
import { fixtureSignals } from './fixtures.js';
test('decision snapshot ranks signals and builds brief evidence timeline and map', () => {
  const snapshot = buildDecisionSnapshot({ signals: fixtureSignals(), watchlists: [{ id: 'w1', label: 'Ports', terms: ['port'], minimumPriority: 50 }] });
  assert.equal(snapshot.signals.length, 4);
  assert.ok(snapshot.signals[0].attention.score >= snapshot.signals[1].attention.score);
  assert.ok(snapshot.brief.sections.length >= 7);
  assert.equal(snapshot.evidence.records.length, 4);
  assert.ok(snapshot.map.features.length >= 3);
  assert.ok(snapshot.cards.length >= 5);
});
