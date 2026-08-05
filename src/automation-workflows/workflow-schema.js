import { DEFAULT_LIMITS, WORKFLOW_STATES } from './constants.js';
import { actionRecord } from './action-schema.js';
import { triggerRecord } from './trigger-schema.js';
import { makeId } from './ids.js';
import { clean, frozen, unique } from './utilities.js';
export function workflowRecord(input = {}) {
    const now = new Date().toISOString();
    const state = WORKFLOW_STATES.includes(String(input.state).toUpperCase()) ? String(input.state).toUpperCase() : 'DRAFT';
    const actions = (input.actions || []).slice(0, DEFAULT_LIMITS.stepsPerWorkflow).map(actionRecord);
    if (!actions.length)
        throw new TypeError('Workflow requires at least one action');
    return frozen({
        id: clean(input.id, 190) || makeId('workflow', input.name),
        name: clean(input.name || 'Untitled workflow', 160),
        description: clean(input.description, 1200),
        state,
        version: Math.max(1, Number(input.version) || 1),
        triggers: (input.triggers || [{ type: 'MANUAL' }]).map(triggerRecord),
        actions,
        tags: unique(input.tags || [], 40),
        owner: clean(input.owner || 'anonymous', 160),
        concurrency: Math.max(1, Math.min(DEFAULT_LIMITS.maximumParallelSteps, Number(input.concurrency) || 3)),
        runPolicy: frozen({
            dedupeMinutes: Math.max(0, Math.min(1440, Number(input.runPolicy?.dedupeMinutes) || 5)),
            suppressMinutes: Math.max(0, Math.min(10080, Number(input.runPolicy?.suppressMinutes) || 0)),
            maximumRunMilliseconds: Math.max(1000, Math.min(DEFAULT_LIMITS.maximumRunMilliseconds, Number(input.runPolicy?.maximumRunMilliseconds) || 60000)),
            quietHours: frozen({ ...(input.runPolicy?.quietHours || {}) })
        }),
        createdAt: input.createdAt || now,
        updatedAt: now
    });
}
