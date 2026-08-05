import { evaluateConditions } from './condition-evaluator.js';
export function evaluateMarketTrigger(trigger, context = {}) {
    const market = context.market || context.signal || {};
    const metric = trigger.configuration.metric || 'priceChangePercent';
    const threshold = Number(trigger.configuration.threshold || 0);
    const direction = String(trigger.configuration.direction || 'ABOVE').toUpperCase();
    const value = Number(market[metric] ?? market.metrics?.[metric]);
    const thresholdPassed = Number.isFinite(value) && (direction === 'BELOW' ? value <= threshold : Math.abs(value) >= Math.abs(threshold));
    const conditions = evaluateConditions(trigger.conditions, { ...context, market }, trigger.match);
    return Object.freeze({ passed: thresholdPassed && conditions.passed, reason: Number.isFinite(value) ? `${metric} ${direction.toLowerCase()} threshold` : `${metric} unavailable`, value, threshold, details: conditions });
}
