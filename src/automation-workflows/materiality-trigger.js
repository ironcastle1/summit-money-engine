import { evaluateConditions } from './condition-evaluator.js';
export function evaluateMaterialityTrigger(trigger, context = {}) {
    const signal = context.signal || {};
    const score = Number(signal.materiality?.score ?? signal.attention?.score ?? signal.score ?? 0);
    const minimum = Number(trigger.configuration.minimumScore || 70);
    const domains = (trigger.configuration.domains || []).map(value => String(value).toUpperCase());
    const domain = String(signal.domain || signal.type || '').toUpperCase();
    const domainPassed = !domains.length || domains.includes(domain);
    const conditions = evaluateConditions(trigger.conditions, context, trigger.match);
    return Object.freeze({ passed: score >= minimum && domainPassed && conditions.passed, reason: score >= minimum ? 'Signal passed materiality threshold' : 'Signal below materiality threshold', score, minimum, domain, details: conditions });
}
