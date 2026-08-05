import { clamp, round } from './numbers.js';
import { ageHours } from './time.js';
export function urgencyScore(signal, now = Date.now()) {
  const age = ageHours(signal.time, now);
  const timeScore = age <= 1 ? 100 : age <= 6 ? 88 : age <= 24 ? 72 : age <= 72 ? 50 : age <= 168 ? 28 : 10;
  const severity = clamp(signal.severity);
  const actionBonus = signal.action ? 10 : 0;
  const score = clamp(timeScore * 0.52 + severity * 0.38 + actionBonus);
  return Object.freeze({ score: round(score, 1), ageHours: round(age, 1), band: score >= 80 ? 'IMMEDIATE' : score >= 60 ? 'TODAY' : score >= 40 ? 'THIS_WEEK' : 'MONITOR' });
}
