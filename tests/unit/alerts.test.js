import test from 'node:test';
import assert from 'node:assert/strict';
import { compare } from '../../src/domain/alerts/operators.js';
import { normalizeAlertRule } from '../../src/domain/alerts/rule-schema.js';
import { getPath, evaluateRule, evaluateRules } from '../../src/domain/alerts/evaluator.js';
import { AlertCooldownRegistry } from '../../src/domain/alerts/cooldown.js';
import { AlertEvaluationService } from '../../src/domain/alerts/alert-service.js';

const ruleInput = {
  id: 'rule-1', name: 'High confidence edge', scope: 'OPPORTUNITY', enabled: true,
  combinator: 'ALL', cooldownMinutes: 60,
  conditions: [
    { field: 'score', operator: 'GTE', expected: 70 },
    { field: 'confidence', operator: 'GTE', expected: 65 }
  ],
  delivery: { browser: true, inApp: true }
};

test('alert operators handle numeric, text, collections, ranges, and changes', () => {
  assert.equal(compare('GT', 11, 10), true);
  assert.equal(compare('LTE', 10, 10), true);
  assert.equal(compare('IN', 'MARKET', ['MARKET', 'EVENT']), true);
  assert.equal(compare('NOT_IN', 'SYSTEM', ['MARKET', 'EVENT']), true);
  assert.equal(compare('CONTAINS', ['BTC', 'CRYPTO'], 'BTC'), true);
  assert.equal(compare('CONTAINS', 'Bitcoin opportunity', 'coin'), true);
  assert.equal(compare('BETWEEN', 7, [5, 10]), true);
  assert.equal(compare('CHANGED_BY', 80, 10, { previous: 65 }), true);
});

test('rule normalization validates and preserves operational settings', () => {
  const rule = normalizeAlertRule(ruleInput, Date.parse('2026-01-01T00:00:00Z'));
  assert.equal(rule.scope, 'OPPORTUNITY');
  assert.equal(rule.conditions.length, 2);
  assert.equal(rule.cooldownMinutes, 60);
  assert.equal(rule.delivery.browser, true);
});

test('nested paths and all/any combinators evaluate correctly', () => {
  const target = { score: 74, confidence: 71, asset: { symbol: 'BTC/USD' }, tags: ['CRYPTO'] };
  assert.equal(getPath(target, 'asset.symbol'), 'BTC/USD');
  const all = evaluateRule(normalizeAlertRule(ruleInput), target);
  assert.equal(all.matched, true);
  const any = evaluateRule(normalizeAlertRule({ ...ruleInput, id: 'rule-2', combinator: 'ANY', conditions: [{ field: 'score', operator: 'GT', expected: 90 }, { field: 'tags', operator: 'CONTAINS', expected: 'CRYPTO' }] }), target);
  assert.equal(any.matched, true);
  const many = evaluateRules([normalizeAlertRule(ruleInput)], [{ id: 'a', ...target }, { id: 'b', score: 40, confidence: 80 }]);
  assert.equal(many.length, 1);
  assert.equal(many[0].targetId, 'a');
});

test('cooldown registry prevents repeated alert delivery until expiry', () => {
  const registry = new AlertCooldownRegistry();
  const rule = normalizeAlertRule(ruleInput);
  const start = Date.parse('2026-01-01T00:00:00Z');
  assert.equal(registry.canTrigger(rule, 'target', start), true);
  registry.record(rule, 'target', start);
  assert.equal(registry.canTrigger(rule, 'target', start + 30 * 60_000), false);
  assert.equal(registry.canTrigger(rule, 'target', start + 60 * 60_000), true);
});

test('alert service applies cooldown across evaluation requests', () => {
  const service = new AlertEvaluationService();
  const target = { id: 'btc', score: 80, confidence: 80 };
  const first = service.evaluate({ rules: [ruleInput], targets: [target], now: Date.parse('2026-01-01T00:00:00Z') });
  const second = service.evaluate({ rules: [ruleInput], targets: [target], now: Date.parse('2026-01-01T00:30:00Z') });
  const third = service.evaluate({ rules: [ruleInput], targets: [target], now: Date.parse('2026-01-01T01:00:00Z') });
  assert.equal(first.matches.length, 1);
  assert.equal(second.matches.length, 0);
  assert.equal(third.matches.length, 1);
});


test('news alert rules support nested verification and burst fields', () => {
  const rule = normalizeAlertRule({
    name: 'Verified burst', scope: 'NEWS', combinator: 'ALL', cooldownMinutes: 30,
    conditions: [
      { field: 'verification.score', operator: 'GTE', expected: 75 },
      { field: 'burst.score', operator: 'GTE', expected: 65 }
    ]
  });
  const result = evaluateRule(rule, { verification: { score: 82 }, burst: { score: 71 } });
  assert.equal(rule.scope, 'NEWS');
  assert.equal(result.matched, true);
});
