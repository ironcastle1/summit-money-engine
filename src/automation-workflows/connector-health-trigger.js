import { evaluateConditions } from './condition-evaluator.js';
export function evaluateConnectorHealthTrigger(trigger, context = {}) {
    const connector = context.connector || context.signal || {};
    const state = String(connector.state || connector.status || 'UNKNOWN').toUpperCase();
    const failing = (trigger.configuration.states || ['DOWN', 'DEGRADED', 'OPEN']).map(String).map(value => value.toUpperCase()).includes(state);
    const conditions = evaluateConditions(trigger.conditions, { ...context, connector }, trigger.match);
    return Object.freeze({ passed: failing && conditions.passed, reason: failing ? `Connector state ${state}` : `Connector state ${state} is acceptable`, state, details: conditions });
}
