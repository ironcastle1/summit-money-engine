import { operationsId } from './ids.js';
import { clean, finite } from './utilities.js';
import { iso } from './time.js';
export function backupRecord(input = {}) {
    if (!input.policyId)
        throw new TypeError('Backup policyId is required');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('backup', input.policyId), policyId: clean(input.policyId, 140), resourceId: clean(input.resourceId, 140), state: clean(input.state, 30).toUpperCase() || 'VERIFIED', sizeBytes: Math.max(0, finite(input.sizeBytes)), checksum: clean(input.checksum, 128), encrypted: input.encrypted !== false, immutable: Boolean(input.immutable), region: clean(input.region, 80) || 'primary', startedAt: input.startedAt || iso(), completedAt: input.completedAt || iso(), expiresAt: input.expiresAt || null, verifiedAt: input.verifiedAt || iso() });
}
