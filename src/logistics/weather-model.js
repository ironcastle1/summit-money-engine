import { clamp, round } from './numbers.js';
export function weatherImpact(input = {}) {
  const windKnots = clamp(Number(input.windKnots || 0), 0, 200);
  const waveM = clamp(Number(input.waveM || 0), 0, 30);
  const visibilityKm = clamp(Number(input.visibilityKm ?? 20), 0, 100);
  const cyclone = input.cyclone ? 35 : 0; const icing = input.icing ? 12 : 0;
  const score = clamp(Math.max(0, windKnots - 20) * 0.9 + Math.max(0, waveM - 2) * 8 + Math.max(0, 5 - visibilityKm) * 5 + cyclone + icing, 0, 100);
  const speedMultiplier = clamp(1 + score / 160, 1, 1.8);
  return Object.freeze({ score: round(score, 1), speedMultiplier: round(speedMultiplier, 3), windKnots, waveM, visibilityKm, cyclone: Boolean(input.cyclone), icing: Boolean(input.icing) });
}
