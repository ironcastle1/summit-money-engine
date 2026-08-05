import { toDate } from './time.js';
import { frozen } from './utilities.js';

export function publicationSchedule(input = {}) {
  const cadence = String(input.cadence || 'AD_HOC').toUpperCase();
  const hour = Math.max(0, Math.min(23, Number(input.hour) || 7));
  const minute = Math.max(0, Math.min(59, Number(input.minute) || 0));
  return frozen({ cadence, hour, minute, weekday: Math.max(0, Math.min(6, Number(input.weekday) || 1)), dayOfMonth: Math.max(1, Math.min(28, Number(input.dayOfMonth) || 1)), timezone: input.timezone || 'Europe/London', enabled: input.enabled !== false });
}

export function scheduleDue(schedule, lastPublishedAt, now = new Date()) {
  const record = publicationSchedule(schedule);
  if (!record.enabled || record.cadence === 'AD_HOC') return false;
  const current = toDate(now, new Date());
  if (current.getUTCHours() < record.hour || (current.getUTCHours() === record.hour && current.getUTCMinutes() < record.minute)) return false;
  const last = toDate(lastPublishedAt);
  if (record.cadence === 'DAILY') return !last || last.toISOString().slice(0, 10) !== current.toISOString().slice(0, 10);
  if (record.cadence === 'WEEKLY') return current.getUTCDay() === record.weekday && (!last || current - last >= 6 * 86400000);
  if (record.cadence === 'MONTHLY') return current.getUTCDate() === record.dayOfMonth && (!last || current.getUTCMonth() !== last.getUTCMonth());
  return false;
}
