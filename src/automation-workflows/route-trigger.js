import { evaluateConditions } from './condition-evaluator.js';
export function evaluateRouteTrigger(trigger, context = {}) {
    const route = context.route || context.signal || {};
    const risk = Number(route.risk?.score ?? route.risk ?? route.score ?? 0);
    const delayHours = Number(route.delayHours ?? route.etaImpactHours ?? 0);
    const passedThreshold = risk >= Number(trigger.configuration.minimumRisk ?? 65) || delayHours >= Number(trigger.configuration.minimumDelayHours ?? 12);
    const conditions = evaluateConditions(trigger.conditions, { ...context, route }, trigger.match);
    return Object.freeze({ passed: passedThreshold && conditions.passed, reason: passedThreshold ? 'Route disruption threshold met' : 'Route remains below threshold', risk, delayHours, details: conditions });
}
