export function timestamp(value) {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}
export function iso(value = Date.now()) {
  const parsed = timestamp(value);
  return parsed === null ? null : new Date(parsed).toISOString();
}
export function ageHours(value, now = Date.now()) {
  const parsed = timestamp(value);
  return parsed === null ? Infinity : Math.max(0, (now - parsed) / 3_600_000);
}
export function recencyWeight(value, halfLifeHours = 24, now = Date.now()) {
  const age = ageHours(value, now);
  return Number.isFinite(age) ? Math.exp(-Math.log(2) * age / Math.max(1, halfLifeHours)) : 0;
}
export function sortNewest(items, field = 'time') {
  return [...(items || [])].sort((a, b) => (timestamp(b?.[field]) || 0) - (timestamp(a?.[field]) || 0));
}
export function windowLabel(hours) {
  const value = Number(hours) || 24;
  return value < 48 ? `${value} HOURS` : `${Math.round(value / 24)} DAYS`;
}
