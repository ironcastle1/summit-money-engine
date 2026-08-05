import { ageMilliseconds } from './time.js';
import { evaluateConditions } from './condition-evaluator.js';
export function evaluateDataFreshnessTrigger(trigger, context = {}) {
    const record = context.record || context.signal || {};
    const updatedAt = record.updatedAt || record.generatedAt || record.time;
    const ageMinutes = ageMilliseconds(updatedAt, context.now || Date.now()) / 60000;
    const maximumAgeMinutes = Number(trigger.configuration.maximumAgeMinutes || 60);
    const conditions = evaluateConditions(trigger.conditions, { ...context, record, ageMinutes }, trigger.match);
    return Object.freeze({ passed: ageMinutes >= maximumAgeMinutes && conditions.passed, reason: Number.isFinite(ageMinutes) ? 'Data exceeded freshness threshold' : 'Data timestamp unavailable', ageMinutes, maximumAgeMinutes, details: conditions });
}
