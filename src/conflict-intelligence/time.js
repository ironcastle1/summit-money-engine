export function timestamp(value) {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}
export function iso(value = Date.now()) {
  const parsed = timestamp(value);
  return parsed === null ? null : new Date(parsed).toISOString();
}
export function ageHours(value,
now = Date.now()) {
  const parsed = timestamp(value);
  return parsed === null ? Infinity : Math.max(0,
  (now - parsed) / 3600000);
}
export function recencyWeight(value,
halfLifeHours = 72,
now = Date.now()) {
  const age = ageHours(value,
  now);
  return Number.isFinite(age) ? Math.exp(-Math.log(2) * age / Math.max(1,
  halfLifeHours)) : 0;
}
export function withinHours(value,
hours,
now = Date.now()) {
  return ageHours(value,
  now) <= Math.max(0,
  Number(hours) || 0);
}
export function sortNewest(items,
field = 'time') {
  return [...(items || [])].sort((a,
  b) => (timestamp(b?.[field]) || 0) - (timestamp(a?.[field]) || 0));
}
