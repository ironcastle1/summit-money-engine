import test from 'node:test';
import assert from 'node:assert/strict';
import { compareScenarios } from '../../src/decision-support/scenario-comparison.js';
import { recommendations } from '../../src/decision-support/recommendation-engine.js';
import { buildDecisionSnapshot } from '../../src/decision-support/snapshot-builder.js';
import { fixtureSignals } from './fixtures.js';
test('scenario comparison and recommendations are ranked', () => {
  const comparison = compareScenarios([{ id: 'a', risk: 80, cost: 40, confidence: 80 }, { id: 'b', risk: 30, cost: 20, confidence: 70 }]);
  assert.equal(comparison.highestRisk.id, 'a');
  const list = recommendations(buildDecisionSnapshot({ signals: fixtureSignals() }));
  assert.ok(list.length >= 2);
  assert.ok(list[0].score >= list.at(-1).score);
});
