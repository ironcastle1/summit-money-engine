import { evaluateConditions } from './condition-evaluator.js';
export function evaluateHazardTrigger(trigger, context = {}) {
    const hazard = context.hazard || context.signal || {};
    const materiality = Number(hazard.materiality?.score ?? hazard.materiality ?? hazard.score ?? 0);
    const minimum = Number(trigger.configuration.minimumMateriality ?? 65);
    const earthquakeAllowed = String(hazard.type || '').toUpperCase() !== 'EARTHQUAKE' || Boolean(hazard.materialImpact || hazard.logisticsImpact || materiality >= Math.max(75, minimum));
    const conditions = evaluateConditions(trigger.conditions, { ...context, hazard }, trigger.match);
    return Object.freeze({ passed: materiality >= minimum && earthquakeAllowed && conditions.passed, reason: earthquakeAllowed ? 'Hazard met materiality gate' : 'Routine earthquake suppressed', materiality, minimum, details: conditions });
}
