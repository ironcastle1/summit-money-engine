import { addHours, iso, toDate } from './time.js';

export function breachClock(incident = {}, now = Date.now()) {
  const start = toDate(incident.awarenessAt || incident.declaredAt, new Date(now));
  const regulated = Boolean(incident.regulatedData);
  const deadline = regulated ? addHours(start, Number(incident.notificationHours) || 72) : null;
  const remainingHours = deadline ? (deadline.getTime() - Number(now)) / 3600000 : null;
  return Object.freeze({
    incidentId: incident.id,
    regulated,
    awarenessAt: iso(start),
    notificationDeadline: deadline ? iso(deadline) : null,
    remainingHours: remainingHours === null ? null : Math.round(remainingHours * 10) / 10,
    state: !regulated ? 'NOT_REQUIRED' : incident.notifiedAt ? 'NOTIFIED' : remainingHours < 0 ? 'OVERDUE' : remainingHours <= 12 ? 'URGENT' : 'OPEN'
  });
}
