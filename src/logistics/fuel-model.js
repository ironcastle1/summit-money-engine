import { HOURS_PER_DAY } from './constants.js';
import { clamp, round } from './numbers.js';
export function fuelConsumption(input) {
  const distanceKm = Math.max(0, Number(input.distanceKm || 0)); const speedKmh = Math.max(1, Number(input.speedKmh || 30));
  const days = distanceKm / speedKmh / HOURS_PER_DAY; const designSpeed = Math.max(1, Number(input.designSpeedKmh || speedKmh));
  const speedRatio = speedKmh / designSpeed; const seaStateFactor = clamp(Number(input.seaStateFactor || 1), 0.75, 1.75);
  const loadFactor = clamp(Number(input.loadFactor || 0.8), 0.1, 1.2); const daily = Math.max(0, Number(input.fuelTonnesPerDay || 60));
  const propulsion = daily * days * speedRatio ** 3 * seaStateFactor * (0.72 + 0.28 * loadFactor);
  const hotel = Math.max(0, Number(input.hotelTonnesPerDay || daily * 0.08)) * days;
  return Object.freeze({ tonnes: round(propulsion + hotel, 2), propulsionTonnes: round(propulsion, 2), hotelTonnes: round(hotel, 2), days: round(days, 3), speedRatio: round(speedRatio, 3) });
}
export function fuelCost(consumption, pricePerTonne = 650) { return round(Number(consumption?.tonnes || 0) * Math.max(0, Number(pricePerTonne)), 2); }
