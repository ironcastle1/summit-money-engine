import { releaseId } from './ids.js';
import { clean, unique } from './utilities.js';
import { iso } from './time.js';
export function migrationRecord(input = {}) { const name = clean(input.name || input.id, 180); if (!name)
    throw new TypeError('Migration name required'); return Object.freeze({ id: clean(input.id, 180) || releaseId('migration', name), name, version: clean(input.version || '0.0.0', 60), componentId: clean(input.componentId || 'core', 120), sequence: Number(input.sequence) || 0, state: clean(input.state || 'PENDING', 30).toUpperCase(), reversible: Boolean(input.reversible), dependencies: unique(input.dependencies, 200), checksum: clean(input.checksum, 128), dryRunSupported: input.dryRunSupported !== false, createdAt: input.createdAt || iso(), updatedAt: iso() }); }
