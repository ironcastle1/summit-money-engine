import { operationsId } from './ids.js';
import { clean, unique } from './utilities.js';
import { iso } from './time.js';
export function onCallSchedule(input = {}) {
    const members = unique(input.members, 200);
    if (!members.length)
        throw new TypeError('On-call schedule requires members');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('oncall', input.name), name: clean(input.name, 180) || 'Primary on-call', timezone: clean(input.timezone, 80) || 'UTC', members, rotationHours: Math.max(1, Number(input.rotationHours) || 168), startsAt: input.startsAt || iso(), active: input.active !== false });
}
export function currentOnCall(schedule, now = Date.now()) { const start = Date.parse(schedule.startsAt); const index = Math.floor(Math.max(0, now - start) / (schedule.rotationHours * 3600000)) % schedule.members.length; return Object.freeze({ scheduleId: schedule.id, userId: schedule.members[index], index, since: new Date(start + Math.floor(Math.max(0, now - start) / (schedule.rotationHours * 3600000)) * schedule.rotationHours * 3600000).toISOString() }); }
