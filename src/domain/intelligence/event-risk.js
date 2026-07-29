import { clamp, round } from '../../core/numbers.js';
import { toTimestamp } from '../../core/time.js';
import { CONFLICT_CATEGORIES, DISASTER_CATEGORIES } from './constants.js';

function decay(ageHours, halfLifeHours) { return 2 ** (-Math.max(0, ageHours) / halfLifeHours); }

export function eventRisk(events, options = {}) {
  const now = Number(options.now || Date.now());
  const categories = options.categories || null;
  const halfLifeHours = Number(options.halfLifeHours || 72);
  const weighted = [];
  for (const event of events || []) {
    if (categories && !categories.has(event.category)) continue;
    const timestamp = toTimestamp(event.time);
    if (!Number.isFinite(timestamp)) continue;
    const ageHours = Math.max(0, (now - timestamp) / 3_600_000);
    const severity = Math.max(0, Math.min(5, Number(event.severity || 0)));
    const value = (0.5 + severity / 5) * decay(ageHours, halfLifeHours);
    weighted.push({ event, value, ageHours });
  }
  weighted.sort((a, b) => b.value - a.value);
  const total = weighted.reduce((sum, item) => sum + item.value, 0);
  const score = round(clamp(100 * (1 - Math.exp(-total / 4)), 0, 100), 1);
  const recent24h = weighted.filter(item => item.ageHours <= 24).length;
  const prior24h = weighted.filter(item => item.ageHours > 24 && item.ageHours <= 48).length;
  const trendPct = prior24h > 0 ? round(((recent24h - prior24h) / prior24h) * 100, 1) : recent24h > 0 ? 100 : 0;
  return Object.freeze({ score, count: weighted.length, recent24h, prior24h, trendPct, evidence: weighted.slice(0, 20).map(item => item.event) });
}

export function conflictRisk(events, options) { return eventRisk(events, { ...options, categories: CONFLICT_CATEGORIES, halfLifeHours: 96 }); }
export function disasterRisk(events, options) { return eventRisk(events, { ...options, categories: DISASTER_CATEGORIES, halfLifeHours: 48 }); }
