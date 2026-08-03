import { stableId } from '../../core/ids.js';
import { clamp } from '../../core/numbers.js';
import { ALERT_OPERATORS } from './operators.js';

export const ALERT_SCOPES = Object.freeze(['OPPORTUNITY', 'NEWS', 'MARKET', 'EVENT', 'PREDICTION', 'SYSTEM']);
export const ALERT_FIELDS = Object.freeze({
  NEWS: ['urgencyScore', 'verification.score', 'verification.independentSources', 'verification.averageReliability', 'burst.score', 'burst.rateRatio', 'claimAgreement.agreementPct', 'claimAgreement.conflictCount', 'articleCount', 'category', 'countries', 'tickers'],
  OPPORTUNITY: ['kind', 'direction', 'score', 'confidence', 'risk', 'probability', 'expectedMove', 'liquidity', 'evidenceGrade', 'symbol', 'category', 'horizon', 'tags'],
  MARKET: ['asset.id', 'asset.symbol', 'timeframe', 'opportunity.score', 'outcomes.0.riseProbability', 'outcomes.0.confidence', 'risk.score', 'signal.score', 'regime.label', 'quote.price', 'quote.change24h'],
  EVENT: ['category', 'severity', 'distanceKm', 'source', 'country', 'clusterSize', 'occurredAt'],
  PREDICTION: ['yesProbability', 'change24h', 'volume24h', 'liquidity', 'category', 'question'],
  SYSTEM: ['eventSourcesOnline', 'marketSourcesOnline', 'cache.hitRate', 'memoryMb.heapUsed', 'uptimeSeconds']
});

function text(value, fallback = '') { return String(value ?? fallback).trim(); }
function normalizeExpected(value) {
  if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? item.trim() : item);
  return value;
}

export function normalizeCondition(condition, index = 0) {
  const field = text(condition?.field);
  const operator = text(condition?.operator).toUpperCase();
  if (!field) throw new TypeError(`Condition ${index + 1} requires a field`);
  if (!ALERT_OPERATORS.includes(operator)) throw new TypeError(`Condition ${index + 1} has unsupported operator ${operator}`);
  return Object.freeze({ field, operator, expected: normalizeExpected(condition.expected) });
}

export function normalizeAlertRule(input, now = Date.now()) {
  const scope = text(input?.scope, 'OPPORTUNITY').toUpperCase();
  if (!ALERT_SCOPES.includes(scope)) throw new TypeError(`Unsupported alert scope ${scope}`);
  const conditions = Array.isArray(input?.conditions) ? input.conditions.map(normalizeCondition) : [];
  if (!conditions.length) throw new TypeError('Alert rule requires at least one condition');
  const combinator = text(input?.combinator, 'ALL').toUpperCase();
  if (!['ALL', 'ANY'].includes(combinator)) throw new TypeError('Alert combinator must be ALL or ANY');
  const name = text(input?.name, `${scope} ALERT`).slice(0, 80);
  const id = text(input?.id) || stableId('alert-rule', name, scope, JSON.stringify(conditions), now);
  const cooldownMinutes = clamp(Number(input?.cooldownMinutes) || 30, 1, 10080);
  return Object.freeze({
    id,
    name,
    scope,
    enabled: input?.enabled !== false,
    combinator,
    conditions,
    cooldownMinutes,
    delivery: Object.freeze({
      browser: input?.delivery?.browser !== false,
      sound: input?.delivery?.sound === true,
      inApp: input?.delivery?.inApp !== false
    }),
    createdAt: input?.createdAt || new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    lastTriggeredAt: input?.lastTriggeredAt || null,
    triggerCount: Math.max(0, Number(input?.triggerCount) || 0)
  });
}

export function publicAlertRule(rule) {
  return { ...rule, conditions: rule.conditions.map(condition => ({ ...condition })), delivery: { ...rule.delivery } };
}
