import { operationsId } from './ids.js';
import { clean, unique } from './utilities.js';
import { iso } from './time.js';
export function backupPolicy(input = {}) {
    const name = clean(input.name, 180);
    if (!name)
        throw new TypeError('Backup policy name is required');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('backup-policy', name), name, resourceIds: unique(input.resourceIds, 500), frequencyHours: Math.max(1, Number(input.frequencyHours) || 24), retentionDays: Math.max(1, Number(input.retentionDays) || 30), encrypted: input.encrypted !== false, immutable: Boolean(input.immutable), regions: unique(input.regions || ['primary'], 20), verificationRequired: input.verificationRequired !== false, active: input.active !== false, createdAt: input.createdAt || iso() });
}
