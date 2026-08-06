export function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function clamp(value, minimum = 0, maximum = 100) {
  return Math.max(minimum, Math.min(maximum, finite(value)));
}

export function clean(value, maximum = 800) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maximum);
}

export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [value];
}

export function unique(values, maximum = 10000) {
  return [...new Set(asArray(values).map(value => typeof value === 'string' ? clean(value, 500) : value))].slice(0, maximum);
}

export function average(values, fallback = 0) {
  const usable = asArray(values).map(Number).filter(Number.isFinite);
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : fallback;
}

export function groupBy(items, selector) {
  const groups = new Map();
  for (const item of items || []) {
    const key = selector(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

export function frozen(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) frozen(child);
  return value;
}

export function percentage(part, total) {
  const denominator = finite(total);
  return denominator > 0 ? clamp(finite(part) / denominator * 100, 0, 10000) : 0;
}

export function severityRank(value) {
  return ({ CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1, SEV1: 5, SEV2: 4, SEV3: 3, SEV4: 2 })[String(value || '').toUpperCase()] || 0;
}
