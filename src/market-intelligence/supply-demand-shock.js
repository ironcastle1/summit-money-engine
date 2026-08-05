import { clamp, round } from './numbers.js';
export function scoreSupplyDemandShock(input = {}) {
  const supplyChange = Number(input.supplyChangePercent) || 0;
  const demandChange = Number(input.demandChangePercent) || 0;
  const inventoryDays = Math.max(0, Number(input.inventoryDays) || 30);
  const spareCapacity = Math.max(0, Number(input.spareCapacityPercent) || 5);
  const durationDays = Math.max(1, Number(input.durationDays) || 7);
  const substitution = clamp(Number(input.substitutionScore) || 30, 0, 100);
  const netShock = demandChange - supplyChange;
  const bufferPenalty = Math.max(0, 30 - inventoryDays) * 0.8 + Math.max(0, 8 - spareCapacity) * 2;
  const persistence = Math.min(25, Math.log2(durationDays + 1) * 4);
  const mitigation = substitution * 0.18;
  const severity = clamp(50 + netShock * 3 + bufferPenalty + persistence - mitigation, 0, 100);
  return Object.freeze({
    severity: round(severity, 2), direction: netShock > 0.25 ? 'TIGHTENING' : netShock < -0.25 ? 'EASING' : 'BALANCED',
    state: severity >= 80 ? 'EXTREME' : severity >= 65 ? 'HIGH' : severity >= 50 ? 'MODERATE' : 'LOW',
    netShockPercent: round(netShock, 3), bufferPenalty: round(bufferPenalty, 2), persistence: round(persistence, 2),
    mitigation: round(mitigation, 2), assumptions: Object.freeze({ supplyChange, demandChange, inventoryDays, spareCapacity, durationDays, substitution })
  });
}
