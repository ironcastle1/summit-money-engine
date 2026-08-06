import { operationsId } from './ids.js';
import { clean } from './utilities.js';
import { iso } from './time.js';
import { runbookById } from './runbook-catalog.js';
export function runbookExecution(input = {}) {
    const runbook = runbookById(input.runbookId);
    if (!runbook)
        throw new TypeError('Unknown runbook');
    const completed = new Set((input.completedSteps || []).map(Number));
    const steps = runbook.steps.map((text, index) => Object.freeze({ index: index + 1, text, complete: completed.has(index + 1) }));
    return Object.freeze({ id: clean(input.id, 140) || operationsId('run', runbook.id), runbookId: runbook.id, incidentId: clean(input.incidentId, 140), state: steps.every(item => item.complete) ? 'COMPLETE' : steps.some(item => item.complete) ? 'IN_PROGRESS' : 'READY', steps, startedAt: input.startedAt || iso(), completedAt: steps.every(item => item.complete) ? iso() : null });
}
