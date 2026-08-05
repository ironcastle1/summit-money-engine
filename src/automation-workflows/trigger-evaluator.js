import { scheduleDue } from './schedule-window.js';
import { evaluateConditions } from './condition-evaluator.js';
import { evaluateEventTrigger } from './event-trigger.js';
import { evaluateMarketTrigger } from './market-trigger.js';
import { evaluateHazardTrigger } from './hazard-trigger.js';
import { evaluateCountryRiskTrigger } from './country-risk-trigger.js';
import { evaluateRouteTrigger } from './route-trigger.js';
import { evaluateConnectorHealthTrigger } from './connector-health-trigger.js';
import { evaluateDataFreshnessTrigger } from './data-freshness-trigger.js';
import { evaluateGeofenceTrigger } from './geofence-trigger.js';
import { evaluateMaterialityTrigger } from './materiality-trigger.js';
const HANDLERS = Object.freeze({
    EVENT: evaluateEventTrigger,
    MARKET_THRESHOLD: evaluateMarketTrigger,
    HAZARD_MATERIALITY: evaluateHazardTrigger,
    COUNTRY_RISK: evaluateCountryRiskTrigger,
    ROUTE_DISRUPTION: evaluateRouteTrigger,
    CONNECTOR_HEALTH: evaluateConnectorHealthTrigger,
    DATA_FRESHNESS: evaluateDataFreshnessTrigger,
    GEOFENCE: evaluateGeofenceTrigger,
    DECISION_SIGNAL: evaluateMaterialityTrigger
});
export function evaluateTrigger(trigger, context = {}) {
    if (!trigger.enabled)
        return Object.freeze({ passed: false, reason: 'Trigger disabled', trigger });
    if (trigger.type === 'MANUAL')
        return Object.freeze({ passed: context.manual === true, reason: context.manual === true ? 'Manual execution requested' : 'Manual execution not requested', trigger });
    if (trigger.type === 'SCHEDULE') {
        const passed = scheduleDue(trigger.configuration.schedule || trigger.configuration, { now: context.now, lastRun: context.lastRun });
        return Object.freeze({ passed, reason: passed ? 'Schedule is due' : 'Schedule is not due', trigger });
    }
    const handler = HANDLERS[trigger.type];
    if (!handler) {
        const details = evaluateConditions(trigger.conditions, context, trigger.match);
        return Object.freeze({ passed: details.passed, reason: details.passed ? 'Conditions matched' : 'Conditions did not match', details, trigger });
    }
    return Object.freeze({ ...handler(trigger, context), trigger });
}
export function evaluateWorkflowTriggers(workflow, context = {}) {
    const results = workflow.triggers.map(trigger => evaluateTrigger(trigger, context));
    return Object.freeze({ passed: results.some(item => item.passed), results: Object.freeze(results) });
}
