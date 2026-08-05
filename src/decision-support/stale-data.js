import { ageHours } from './time.js';
export function staleData(signals = [], thresholds = {}) {
  const defaults = { MARKETS: 2, CONFLICT: 24, HAZARDS: 12, LOGISTICS: 24, COUNTRIES: 168, OPPORTUNITIES: 72, EXECUTIVE: 72 };
  const stale = signals.filter(signal => ageHours(signal.time) > Number(thresholds[signal.domain] ?? defaults[signal.domain] ?? 72));
  return Object.freeze({ count: stale.length, items: Object.freeze(stale.map(signal => Object.freeze({ id: signal.id, title: signal.title, domain: signal.domain, ageHours: Math.round(ageHours(signal.time) * 10) / 10 }))) });
}
