import { ACTION_TYPES, CHANNEL_TYPES, CONDITION_OPERATORS, TRIGGER_TYPES, WORKFLOW_STATES } from './constants.js';
export function automationCatalog() {
    return Object.freeze({ version: '20.13.0', workspace: 'AUTOMATION', workflowStates: WORKFLOW_STATES, triggerTypes: TRIGGER_TYPES, conditionOperators: CONDITION_OPERATORS, actionTypes: ACTION_TYPES, channels: CHANNEL_TYPES, templates: Object.freeze([
            Object.freeze({ id: 'critical-signal', name: 'Critical signal escalation', trigger: 'DECISION_SIGNAL', actions: ['SEND_NOTIFICATION', 'CREATE_TASK', 'CREATE_CASE'] }),
            Object.freeze({ id: 'major-hazard', name: 'Major hazard response', trigger: 'HAZARD_MATERIALITY', actions: ['CREATE_CASE', 'GENERATE_REPORT', 'SEND_NOTIFICATION'] }),
            Object.freeze({ id: 'route-disruption', name: 'Route disruption response', trigger: 'ROUTE_DISRUPTION', actions: ['CREATE_TASK', 'SEND_NOTIFICATION'] }),
            Object.freeze({ id: 'market-threshold', name: 'Market threshold watch', trigger: 'MARKET_THRESHOLD', actions: ['SEND_NOTIFICATION', 'ADD_WATCHLIST'] }),
            Object.freeze({ id: 'source-health', name: 'Source health escalation', trigger: 'CONNECTOR_HEALTH', actions: ['CREATE_TASK', 'SEND_NOTIFICATION'] }),
            Object.freeze({ id: 'morning-report', name: 'Scheduled morning report', trigger: 'SCHEDULE', actions: ['GENERATE_REPORT', 'SEND_NOTIFICATION'] })
        ]) });
}
