import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDecisionSnapshot } from '../../src/decision-support/snapshot-builder.js';
import { fixtureSignals } from './fixtures.js';
test('watchlist rules generate quantified alert candidates', () => {
  const snapshot = buildDecisionSnapshot({ signals: fixtureSignals(), watchlists: [{ id: 'route-watch', label: 'Route risk', terms: ['corridor','port'], minimumPriority: 55 }] });
  assert.ok(snapshot.alerts.length >= 1);
  assert.equal(snapshot.alerts[0].watchId, 'route-watch');
  assert.ok(snapshot.alerts[0].score >= 55);
});
