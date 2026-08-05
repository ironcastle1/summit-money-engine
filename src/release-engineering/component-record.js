import { releaseId } from './ids.js';
import { clean, unique } from './utilities.js';
import { iso } from './time.js';
export function componentRecord(input = {}) { const name = clean(input.name || input.id, 160); if (!name)
    throw new TypeError('Component name is required'); return Object.freeze({ id: clean(input.id, 160) || releaseId('component', name), name, type: clean(input.type || 'SERVICE', 40).toUpperCase(), version: clean(input.version || '0.0.0', 60), ownerTeam: clean(input.ownerTeam || 'PLATFORM', 100), criticality: clean(input.criticality || 'MEDIUM', 30).toUpperCase(), dependencies: unique(input.dependencies, 500), entrypoints: unique(input.entrypoints, 500), state: clean(input.state || 'ACTIVE', 30).toUpperCase(), createdAt: input.createdAt || iso(), updatedAt: iso() }); }
