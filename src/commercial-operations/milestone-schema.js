import { commercialId } from './ids.js';
import { clean, frozen } from './utilities.js';
export function milestoneRecord(input = {}) { return frozen({ id: clean(input.id, 190) || commercialId('milestone', input.title), title: clean(input.title || 'Milestone', 240), state: String(input.state || 'NOT_STARTED').toUpperCase(), dueAt: input.dueAt || null, owner: clean(input.owner, 190), evidence: clean(input.evidence, 2000), completedAt: input.completedAt || null }); }
