import { evaluateConditions } from './condition-evaluator.js';
export function evaluateCountryRiskTrigger(trigger, context = {}) {
    const country = context.country || context.signal || {};
    const score = Number(country.risk?.score ?? country.score ?? 0);
    const change = Number(country.change ?? country.delta ?? 0);
    const passedThreshold = score >= Number(trigger.configuration.minimumScore ?? 70) || change >= Number(trigger.configuration.minimumChange ?? 10);
    const conditions = evaluateConditions(trigger.conditions, { ...context, country }, trigger.match);
    return Object.freeze({ passed: passedThreshold && conditions.passed, reason: passedThreshold ? 'Country risk threshold met' : 'Country risk below threshold', score, change, details: conditions });
}
