import { addDays, daysBetween, iso, toDate } from './time.js';

export function keyRotationStatus(secret, now = Date.now()) {
  const rotationDays = Math.max(1, Number(secret?.rotationDays) || 90);
  const last = toDate(secret?.lastRotatedAt, new Date(0));
  const ageDays = daysBetween(last, now);
  const overdueDays = Math.max(0, ageDays - rotationDays);
  return Object.freeze({
    secretId: secret?.id,
    rotationDays,
    ageDays: Math.round(ageDays * 10) / 10,
    overdueDays: Math.round(overdueDays * 10) / 10,
    state: overdueDays > 0 ? 'OVERDUE' : ageDays >= rotationDays * 0.8 ? 'DUE_SOON' : 'CURRENT',
    nextRotationAt: iso(addDays(last, rotationDays))
  });
}
