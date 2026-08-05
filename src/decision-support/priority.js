import { PRIORITY_BANDS } from './constants.js';
import { clamp, round } from './numbers.js';
export function priorityBand(score) {
  const value = clamp(score);
  return PRIORITY_BANDS.find(item => value >= item.minimum && value <= item.maximum)?.id || 'ROUTINE';
}
export function priority(score, reasons = []) {
  const value = round(clamp(score), 1);
  return Object.freeze({ score: value, band: priorityBand(value), reasons: Object.freeze([...new Set(reasons)].slice(0, 12)) });
}
