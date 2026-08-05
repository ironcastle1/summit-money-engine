import { commercialId } from './ids.js';
import { clean, frozen } from './utilities.js';
export function statusComponentRecord(input = {}) { const now = new Date().toISOString(); return frozen({ id: clean(input.id, 190) || commercialId('component', input.name), name: clean(input.name || 'Service component', 180), group: clean(input.group || 'PLATFORM', 120).toUpperCase(), state: String(input.state || 'OPERATIONAL').toUpperCase(), description: clean(input.description, 1000), public: input.public !== false, createdAt: input.createdAt || now, updatedAt: now }); }
