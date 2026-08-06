import { operationsId } from './ids.js';
import { clean, unique } from './utilities.js';
import { iso } from './time.js';
export function releaseRecord(input = {}) {
    const version = clean(input.version, 80);
    if (!version)
        throw new TypeError('Release version is required');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('release', version), version, title: clean(input.title, 200) || `Merlin ${version}`, environment: clean(input.environment, 40).toLowerCase() || 'production', commitSha: clean(input.commitSha, 100), artifactChecksum: clean(input.artifactChecksum, 128), changes: unique(input.changes, 500), riskLevel: clean(input.riskLevel, 20).toUpperCase() || 'MEDIUM', state: clean(input.state, 30).toUpperCase() || 'DRAFT', owner: clean(input.owner, 160), approvedBy: unique(input.approvedBy, 50), createdAt: input.createdAt || iso(), updatedAt: iso() });
}
