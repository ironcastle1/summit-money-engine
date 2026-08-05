import { scheduleDefinition } from './schedule-parser.js';
import { toDate } from './time.js';
export function scheduleDue(input, options = {}) {
    const schedule = scheduleDefinition(input);
    const now = toDate(options.now, new Date());
    const lastRun = toDate(options.lastRun);
    if (schedule.type === 'INTERVAL')
        return !lastRun || now - lastRun >= schedule.intervalMinutes * 60000;
    if (schedule.type === 'ONCE')
        return Boolean(schedule.at) && now >= new Date(schedule.at) && (!lastRun || lastRun < new Date(schedule.at));
    const local = new Date(now.toLocaleString('en-US', { timeZone: schedule.timezone }));
    if (schedule.type === 'WEEKLY' && !schedule.weekdays.includes(local.getDay()))
        return false;
    const scheduledToday = new Date(local);
    scheduledToday.setHours(schedule.time.hour, schedule.time.minute, 0, 0);
    if (local < scheduledToday)
        return false;
    return !lastRun || new Date(lastRun.toLocaleString('en-US', { timeZone: schedule.timezone })) < scheduledToday;
}
