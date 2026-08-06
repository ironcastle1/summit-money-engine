import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ConflictWatchlist
}
from '../../src/conflict-intelligence/watchlist.js';
import {
  evaluateConflictAlerts
}
from '../../src/conflict-intelligence/alert-evaluator.js';
import {
  buildConflictSnapshot
}
from '../../src/conflict-intelligence/snapshot-builder.js';
import {
  rawEvents
}
from './fixtures.js';
test('watchlists create quantified conflict alerts',
async () => {
  const store = new ConflictWatchlist(),
  watch = await store.add('u1',
  {
    theatreId: 'example-war',
    minimumRisk: 10,
    minimumEscalation: 10
  }),
  alerts = evaluateConflictAlerts([watch],
  buildConflictSnapshot(rawEvents).theatres);
  assert.equal(alerts.length,
  1);
});
