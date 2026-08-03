import { stableId } from '../../core/ids.js';
import { compare } from './operators.js';

export function getPath(object, path) {
  if (!path) return undefined;
  const segments = String(path).split('.');
  let current = object;
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    const key = /^\d+$/.test(segment) ? Number(segment) : segment;
    current = current[key];
  }
  return current;
}

function conditionResult(condition, target, previousTarget) {
  const actual = getPath(target, condition.field);
  const previous = previousTarget ? getPath(previousTarget, condition.field) : undefined;
  const matched = compare(condition.operator, actual, condition.expected, { previous });
  return { field: condition.field, operator: condition.operator, expected: condition.expected, actual, previous, matched };
}

export function evaluateRule(rule, target, options = {}) {
  if (!rule?.enabled) return { matched: false, reason: 'DISABLED', conditions: [] };
  const conditions = rule.conditions.map(condition => conditionResult(condition, target, options.previousTarget));
  const matched = rule.combinator === 'ANY' ? conditions.some(item => item.matched) : conditions.every(item => item.matched);
  return { matched, reason: matched ? 'MATCHED' : 'CONDITIONS_NOT_MET', conditions };
}

export function evaluateRules(rules, targets, options = {}) {
  const now = options.now || Date.now();
  const previousById = options.previousById || new Map();
  const matches = [];
  for (const rule of rules) {
    for (const target of targets) {
      const targetId = String(target.id || target.assetId || target.marketId || target.eventId || target.title || 'target');
      const previousTarget = previousById.get(targetId);
      const result = evaluateRule(rule, target, { previousTarget });
      if (!result.matched) continue;
      matches.push({
        id: stableId('alert-match', rule.id, targetId, Math.floor(now / 60_000)),
        ruleId: rule.id,
        ruleName: rule.name,
        scope: rule.scope,
        targetId,
        target,
        conditions: result.conditions,
        triggeredAt: new Date(now).toISOString()
      });
    }
  }
  return matches;
}
