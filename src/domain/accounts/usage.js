function dayKey(date = new Date()) { return date.toISOString().slice(0, 10); }

export function normalizeUsage(value, date = new Date()) {
  const current = value && value.day === dayKey(date) ? value : { day: dayKey(date), counters: {} };
  return { day: current.day, counters: { ...(current.counters || {}) } };
}

export function incrementUsage(value, key, amount = 1, date = new Date()) {
  const usage = normalizeUsage(value, date);
  usage.counters[key] = Math.max(0, Number(usage.counters[key] || 0) + Number(amount || 0));
  return usage;
}

export function usageCounters(value, date = new Date()) {
  return normalizeUsage(value, date).counters;
}
