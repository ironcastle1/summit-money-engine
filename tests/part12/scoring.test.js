import test from 'node:test';
import assert from 'node:assert/strict';
import { attentionScore } from '../../src/decision-support/attention-score.js';
import { fixtureSignals } from './fixtures.js';
test('attention scoring combines urgency importance confidence and actionability', () => {
  const score = attentionScore(fixtureSignals()[0]);
  assert.ok(score.score >= 70);
  assert.ok(['URGENT','CRITICAL'].includes(score.band));
  assert.equal(score.confidence.band, 'HIGH');
  assert.ok(['ACTIONABLE', 'DIRECT'].includes(score.actionability.band));
});
