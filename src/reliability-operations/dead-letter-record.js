import { operationsId } from './ids.js';
import { clean } from './utilities.js';
import { iso } from './time.js';
export function deadLetterRecord(input = {}) {
    if (!input.jobId)
        throw new TypeError('Dead-letter jobId is required');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('dlq', input.jobId), jobId: clean(input.jobId, 140), queueId: clean(input.queueId, 140), reason: clean(input.reason, 1500) || 'MAXIMUM_ATTEMPTS', payloadHash: clean(input.payloadHash, 128), quarantinedAt: input.quarantinedAt || iso(), replayedAt: input.replayedAt || null, state: input.replayedAt ? 'REPLAYED' : 'QUARANTINED' });
}
