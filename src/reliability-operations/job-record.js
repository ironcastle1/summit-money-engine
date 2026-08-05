import { operationsId } from './ids.js';
import { clean } from './utilities.js';
import { iso } from './time.js';
export function jobRecord(input = {}) {
    if (!input.queueId)
        throw new TypeError('Job queueId is required');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('job', input.type || input.queueId), queueId: clean(input.queueId, 140), type: clean(input.type, 100).toUpperCase() || 'JOB', state: clean(input.state, 30).toUpperCase() || 'QUEUED', attempts: Math.max(0, Number(input.attempts) || 0), maximumAttempts: Math.max(1, Number(input.maximumAttempts) || 3), payloadHash: clean(input.payloadHash, 128), scheduledAt: input.scheduledAt || iso(), startedAt: input.startedAt || null, completedAt: input.completedAt || null, error: clean(input.error, 1500) });
}
