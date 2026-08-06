import { clamp, round } from './numbers.js';
export function infrastructureImpact(input = {}) {
  const power = clamp(Number(input.powerAvailability ?? 100), 0, 100);
  const cranes = clamp(Number(input.craneAvailability ?? 100), 0, 100);
  const channel = clamp(Number(input.channelAvailability ?? 100), 0, 100);
  const rail = clamp(Number(input.railAvailability ?? 100), 0, 100);
  const road = clamp(Number(input.roadAvailability ?? 100), 0, 100);
  const digital = clamp(Number(input.digitalAvailability ?? 100), 0, 100);
  const score = clamp((100 - power) * 0.20 + (100 - cranes) * 0.22 + (100 - channel) * 0.26 + (100 - rail) * 0.11 + (100 - road) * 0.09 + (100 - digital) * 0.12, 0, 100);
  return Object.freeze({ score: round(score, 1), availability: Object.freeze({ power, cranes, channel, rail, road, digital }), closed: channel <= 5 || power <= 5 });
}
