import { toDate } from './time.js';
const WEEKDAYS = Object.freeze({ SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 });
export function parseClock(value = '09:00') {
    if (value && typeof value === 'object' && Number.isInteger(value.hour) && Number.isInteger(value.minute)) {
        if (value.hour < 0 || value.hour > 23 || value.minute < 0 || value.minute > 59)
            throw new RangeError('Schedule time is outside the valid clock range');
        return Object.freeze({ hour: value.hour, minute: value.minute });
    }
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(value));
    if (!match)
        throw new TypeError('Schedule time must use HH:MM');
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59)
        throw new RangeError('Schedule time is outside the valid clock range');
    return Object.freeze({ hour, minute });
}
export function parseWeekdays(values = []) {
    return Object.freeze((values.length ? values : Object.keys(WEEKDAYS)).map(value => {
        if (Number.isInteger(value) && value >= 0 && value <= 6)
            return value;
        const text = String(value).slice(0, 3).toUpperCase();
        if (!(text in WEEKDAYS))
            throw new TypeError(`Unsupported weekday: ${value}`);
        return WEEKDAYS[text];
    }));
}
export function scheduleDefinition(input = {}) {
    const type = String(input.type || 'DAILY').toUpperCase();
    if (!['INTERVAL', 'DAILY', 'WEEKLY', 'ONCE'].includes(type))
        throw new TypeError(`Unsupported schedule type: ${type}`);
    return Object.freeze({
        type,
        intervalMinutes: Math.max(1, Number(input.intervalMinutes) || 60),
        time: parseClock(input.time || '09:00'),
        weekdays: parseWeekdays(input.weekdays || []),
        at: toDate(input.at)?.toISOString() || null,
        timezone: String(input.timezone || 'UTC')
    });
}
