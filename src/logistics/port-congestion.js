import { clamp, round } from './numbers.js';
export function portCongestionScore(input = {}) {
  const waiting = clamp(Number(input.waitingVessels || 0), 0, 500);
  const berthUtilization = clamp(Number(input.berthUtilization || 0), 0, 1);
  const anchorageHours = clamp(Number(input.averageAnchorageHours || 0), 0, 240);
  const throughputChange = clamp(Number(input.throughputChangePct || 0), -100, 100);
  const labour = input.labourDisruption ? 18 : 0; const closure = input.closed ? 100 : 0;
  const score = Math.max(closure, waiting / 5 + berthUtilization * 38 + anchorageHours / 4 + Math.max(0, -throughputChange) * 0.35 + labour);
  return Object.freeze({ score: round(clamp(score, 0, 100), 1), waitingVessels: waiting, berthUtilization: round(berthUtilization, 3), averageAnchorageHours: anchorageHours, throughputChangePct: throughputChange, labourDisruption: Boolean(input.labourDisruption), closed: Boolean(input.closed) });
}
export function congestionDelayHours(congestion, baselineHours = 4) {
  const score = Number(congestion?.score || 0); if (score >= 95) return 168;
  return round(Math.max(0, Number(baselineHours)) + (score / 100) ** 2 * 96, 1);
}
