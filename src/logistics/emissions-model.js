import { round } from './numbers.js';
const FACTORS = Object.freeze({ HFO: 3.114, VLSFO: 3.151, MGO: 3.206, LNG: 2.750, METHANOL: 1.375, AMMONIA: 0 });
export function emissionsFromFuel(fuelTonnes, fuelType = 'VLSFO') {
  const type = String(fuelType).toUpperCase(); const factor = FACTORS[type] ?? FACTORS.VLSFO; const tonnes = Math.max(0, Number(fuelTonnes || 0));
  return Object.freeze({ fuelType: type, fuelTonnes: round(tonnes, 2), co2Tonnes: round(tonnes * factor, 2), factor });
}
export function emissionsIntensity(emissions, cargoTonnes, distanceKm) {
  const denominator = Math.max(1, Number(cargoTonnes || 0) * Number(distanceKm || 0));
  return round(Number(emissions?.co2Tonnes || 0) * 1_000_000 / denominator, 3);
}
export function compareEmissions(options) { const values = options.map(item => ({ ...item, intensity: emissionsIntensity(item.emissions, item.cargoTonnes, item.distanceKm) })); return values.sort((a, b) => a.intensity - b.intensity); }
