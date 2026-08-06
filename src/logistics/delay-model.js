import { clamp, round } from './numbers.js';
export function disruptionDelay(input = {}) {
  const risk = clamp(Number(input.riskScore || 0), 0, 100);
  const congestionHours = Math.max(0, Number(input.congestionHours || 0));
  const closureHours = Math.max(0, Number(input.closureHours || 0));
  const customsHours = Math.max(0, Number(input.customsHours || 0));
  const labourHours = Math.max(0, Number(input.labourHours || 0));
  const stochastic = (risk / 100) ** 2 * Math.max(0, Number(input.maximumRiskDelayHours || 120));
  return Object.freeze({ expectedHours: round(congestionHours + closureHours + customsHours + labourHours + stochastic, 1), components: Object.freeze({ congestionHours, closureHours, customsHours, labourHours, stochasticHours: round(stochastic, 1) }) });
}
export function delayProbability(delay, thresholdHours) { const expected = Math.max(0, Number(delay?.expectedHours || 0)); const threshold = Math.max(0.1, Number(thresholdHours || 24)); return round(clamp(1 - Math.exp(-expected / threshold), 0, 1), 3); }
