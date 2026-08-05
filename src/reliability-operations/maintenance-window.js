import { operationsId } from './ids.js';
import { clean, unique } from './utilities.js';
import { iso } from './time.js';
export function maintenanceWindow(input = {}) {
    const title = clean(input.title, 200);
    if (!title)
        throw new TypeError('Maintenance title is required');
    const startsAt = input.startsAt || iso();
    const endsAt = input.endsAt || new Date(Date.parse(startsAt) + 3600000).toISOString();
    if (Date.parse(endsAt) <= Date.parse(startsAt))
        throw new TypeError('Maintenance end must be after start');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('maintenance', title), title, serviceIds: unique(input.serviceIds, 100), startsAt, endsAt, impact: clean(input.impact, 1000), customerVisible: input.customerVisible !== false, state: clean(input.state, 30).toUpperCase() || 'SCHEDULED', owner: clean(input.owner, 160) });
}
