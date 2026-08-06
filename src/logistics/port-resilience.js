import { clamp, round, weightedMean } from './numbers.js';
export function portResilience(port, context = {}) {
  const alternatePorts = clamp(Number(context.alternatePortCount || 0), 0, 20);
  const hinterland = clamp(Number(context.hinterlandConnectivity || 50), 0, 100);
  const backupPower = context.backupPower ? 100 : 35;
  const cyber = clamp(Number(context.cyberMaturity || 50), 0, 100);
  const recovery = clamp(Number(context.recoveryCapability || 50), 0, 100);
  const importancePenalty = clamp(Number(port.importance || 50), 0, 100) * 0.08;
  const score = weightedMean([{ value: Math.min(100, alternatePorts * 12), weight: 0.22 }, { value: hinterland, weight: 0.24 }, { value: backupPower, weight: 0.16 }, { value: cyber, weight: 0.16 }, { value: recovery, weight: 0.22 }]);
  return Object.freeze({ score: round(clamp(score - importancePenalty, 0, 100), 1), alternatePortCount: alternatePorts, components: Object.freeze({ hinterland, backupPower, cyber, recovery }) });
}
