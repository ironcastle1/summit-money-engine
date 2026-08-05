import { evaluateConditions } from './condition-evaluator.js';
export function evaluateEventTrigger(trigger, context = {}) {
    const event = context.event || context.signal || {};
    const allowedTypes = (trigger.configuration.eventTypes || []).map(value => String(value).toUpperCase());
    const eventType = String(event.type || event.category || event.domain || '').toUpperCase();
    const typePassed = !allowedTypes.length || allowedTypes.includes(eventType);
    const conditions = evaluateConditions(trigger.conditions, { ...context, event }, trigger.match);
    return Object.freeze({ passed: typePassed && conditions.passed, reason: typePassed ? 'Event matched configured filters' : 'Event type excluded', details: conditions });
}
