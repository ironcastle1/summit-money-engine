import { addHours } from './time.js';
import { clean, frozen } from './utilities.js';
export function maintenanceWindow(input = {}) { const start = new Date(input.startsAt || Date.now()); const end = input.endsAt ? new Date(input.endsAt) : addHours(start, input.durationHours || 1); if (end <= start)
    throw new TypeError('Maintenance end must follow start'); return frozen({ id: clean(input.id || `maintenance-${start.getTime()}`, 190), title: clean(input.title || 'Scheduled maintenance', 240), componentIds: Object.freeze([...(input.componentIds || [])]), startsAt: start.toISOString(), endsAt: end.toISOString(), customerImpact: clean(input.customerImpact || 'No expected customer impact', 2000), state: String(input.state || 'SCHEDULED').toUpperCase() }); }
