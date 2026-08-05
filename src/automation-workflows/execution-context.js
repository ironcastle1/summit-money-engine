import { makeId } from './ids.js';
import { frozen } from './utilities.js';
export function executionContext(input = {}) {
    const startedAt = input.startedAt || new Date().toISOString();
    return frozen({
        runId: input.runId || makeId('run'),
        workflowId: input.workflowId,
        owner: input.owner || 'anonymous',
        trigger: input.trigger || null,
        signal: input.signal || null,
        event: input.event || null,
        market: input.market || null,
        hazard: input.hazard || null,
        country: input.country || null,
        route: input.route || null,
        connector: input.connector || null,
        payload: input.payload || {},
        variables: input.variables || {},
        startedAt,
        now: input.now || startedAt
    });
}
export function stepContext(context, outputs, action) {
    return Object.freeze({ ...context, action, outputs: Object.freeze({ ...outputs }), previous: Object.freeze({ ...outputs }) });
}
