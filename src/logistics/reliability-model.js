import { clamp, round } from './numbers.js';
export function routeReliability(input = {}) {
  const historicalOnTime = clamp(Number(input.historicalOnTimePct ?? 80), 0, 100);
  const risk = clamp(Number(input.riskScore || 0), 0, 100);
  const congestion = clamp(Number(input.congestionScore || 0), 0, 100);
  const weather = clamp(Number(input.weatherScore || 0), 0, 100);
  const redundancy = clamp(Number(input.redundancyScore || 0), 0, 100);
  const score = clamp(historicalOnTime * 0.48 + (100 - risk) * 0.22 + (100 - congestion) * 0.12 + (100 - weather) * 0.08 + redundancy * 0.10, 0, 100);
  const uncertaintyHours = Math.max(2, (100 - score) * 0.72);
  return Object.freeze({ score: round(score, 1), probabilityOnTime: round(clamp(score / 100, 0.01, 0.99), 3), uncertaintyHours: round(uncertaintyHours, 1) });
}
