import { clamp, round } from './numbers.js';
export function estimatePortCapacity(port, activity = {}) {
  const importance = clamp(Number(port.importance || 50), 0, 100);
  const berthCount = Math.max(1, Number(activity.berthCount || Math.round(2 + importance / 8)));
  const craneCount = Math.max(1, Number(activity.craneCount || Math.round(1 + importance / 6)));
  const nominalTeuDay = Number(activity.nominalTeuDay || berthCount * craneCount * 480);
  const availability = clamp(Number(activity.availability ?? 1), 0, 1);
  const weatherFactor = clamp(Number(activity.weatherFactor ?? 1), 0.1, 1.15);
  const labourFactor = clamp(Number(activity.labourFactor ?? 1), 0.1, 1.1);
  const effective = nominalTeuDay * availability * weatherFactor * labourFactor;
  return Object.freeze({ berthCount, craneCount, nominalTeuDay: round(nominalTeuDay, 0), effectiveTeuDay: round(effective, 0), utilizationHeadroomPct: round(Math.max(0, (effective - Number(activity.currentTeuDay || 0)) / Math.max(1, effective) * 100), 1) });
}
