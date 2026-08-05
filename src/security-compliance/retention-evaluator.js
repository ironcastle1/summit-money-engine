import { retentionSchedule } from './retention-catalog.js';
import { addDays, iso, toDate } from './time.js';

export function evaluateRetention(record = {}, holds = [], now = Date.now()) {
  const schedule = retentionSchedule(record.retentionScheduleId) || { minimumDays: 30, maximumDays: 365 };
  const createdAt = toDate(record.createdAt, new Date(now));
  const deleteAfter = addDays(createdAt, Number(record.retentionDays) || schedule.maximumDays);
  const activeHolds = holds.filter(hold => hold.active !== false && (!hold.recordIds?.length || hold.recordIds.includes(record.id)));
  const eligible = Number(now) >= deleteAfter.getTime() && activeHolds.length === 0;
  return Object.freeze({
    recordId: record.id,
    scheduleId: record.retentionScheduleId,
    deleteAfter: iso(deleteAfter),
    eligibleForDeletion: eligible,
    legalHolds: Object.freeze(activeHolds.map(hold => hold.id)),
    reason: activeHolds.length ? 'LEGAL_HOLD' : eligible ? 'RETENTION_EXPIRED' : 'RETENTION_ACTIVE'
  });
}
