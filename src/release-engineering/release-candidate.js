import { releaseId } from './ids.js';
import { clean, unique } from './utilities.js';
import { iso } from './time.js';
export function releaseCandidate(input = {}) { const version = clean(input.version, 60); if (!version)
    throw new TypeError('Candidate version required'); return Object.freeze({ id: clean(input.id, 180) || releaseId('candidate', version), version, title: clean(input.title || `Merlin ${version}`, 240), state: clean(input.state || 'DRAFT', 30).toUpperCase(), environment: clean(input.environment || 'production', 80), componentIds: unique(input.componentIds, 10000), migrationIds: unique(input.migrationIds, 10000), artifactIds: unique(input.artifactIds, 25000), breakingChanges: unique(input.breakingChanges, 5000), approvals: unique(input.approvals, 1000), createdBy: clean(input.createdBy || 'operator', 160), createdAt: input.createdAt || iso(), updatedAt: iso() }); }
