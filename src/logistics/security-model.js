import { clamp, round } from './numbers.js';
function signal(input, key) { return Object.prototype.hasOwnProperty.call(input, key) ? clamp(Number(input[key] || 0), 0, 100) : null; }
export function securityImpact(input = {}) {
  const piracy = signal(input, 'piracyRisk');
  const conflict = signal(input, 'conflictRisk');
  const terrorism = signal(input, 'terrorismRisk');
  const interdiction = signal(input, 'interdictionRisk');
  const mineRisk = signal(input, 'mineRisk');
  const weighted = [
    { value: piracy, weight: 0.23 },
    { value: conflict, weight: 0.31 },
    { value: terrorism, weight: 0.14 },
    { value: interdiction, weight: 0.18 },
    { value: mineRisk, weight: 0.14 }
  ].filter(item => item.value !== null);
  const denominator = weighted.reduce((sum, item) => sum + item.weight, 0);
  const raw = denominator ? weighted.reduce((sum, item) => sum + item.value * item.weight, 0) / denominator : 0;
  const score = clamp(raw + (input.escortAvailable ? -8 : 0), 0, 100);
  return Object.freeze({ score: round(score, 1), components: Object.freeze({ piracy, conflict, terrorism, interdiction, mineRisk, escortAvailable: Boolean(input.escortAvailable) }) });
}
