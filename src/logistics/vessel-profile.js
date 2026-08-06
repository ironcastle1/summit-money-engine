import { VESSEL_CLASSES } from './constants.js';
import { enumValue } from './validation.js';
const PROFILES = Object.freeze({
  FEEDER: { capacityTeu: 2500, deadweightTonnes: 35_000, speedKnots: 16, draftM: 10.5, fuelTonnesPerDay: 45, canalCompatible: true },
  PANAMAX: { capacityTeu: 5000, deadweightTonnes: 75_000, speedKnots: 18, draftM: 12.0, fuelTonnesPerDay: 78, canalCompatible: true },
  POST_PANAMAX: { capacityTeu: 10_000, deadweightTonnes: 130_000, speedKnots: 19, draftM: 14.5, fuelTonnesPerDay: 118, canalCompatible: false },
  ULCV: { capacityTeu: 22_000, deadweightTonnes: 230_000, speedKnots: 19, draftM: 16.0, fuelTonnesPerDay: 165, canalCompatible: false },
  HANDYSIZE: { capacityTeu: 0, deadweightTonnes: 35_000, speedKnots: 13, draftM: 10.0, fuelTonnesPerDay: 28, canalCompatible: true },
  AFRAMAX: { capacityTeu: 0, deadweightTonnes: 115_000, speedKnots: 14.5, draftM: 14.8, fuelTonnesPerDay: 54, canalCompatible: true },
  SUEZMAX: { capacityTeu: 0, deadweightTonnes: 160_000, speedKnots: 14, draftM: 17.0, fuelTonnesPerDay: 68, canalCompatible: false },
  VLCC: { capacityTeu: 0, deadweightTonnes: 300_000, speedKnots: 13.5, draftM: 20.5, fuelTonnesPerDay: 92, canalCompatible: false },
  LNG: { capacityTeu: 0, deadweightTonnes: 95_000, speedKnots: 18.5, draftM: 12.5, fuelTonnesPerDay: 82, canalCompatible: true },
  LPG: { capacityTeu: 0, deadweightTonnes: 55_000, speedKnots: 17, draftM: 11.5, fuelTonnesPerDay: 52, canalCompatible: true },
  RORO: { capacityTeu: 0, deadweightTonnes: 35_000, speedKnots: 20, draftM: 9.5, fuelTonnesPerDay: 70, canalCompatible: true },
  GENERAL_CARGO: { capacityTeu: 0, deadweightTonnes: 25_000, speedKnots: 14, draftM: 9.0, fuelTonnesPerDay: 30, canalCompatible: true }
});
export function vesselProfile(id = 'PANAMAX', overrides = {}) {
  const normalized = enumValue(id, VESSEL_CLASSES, 'vesselClass');
  return Object.freeze({ id: normalized, ...PROFILES[normalized], ...overrides });
}
export function vesselProfiles() { return Object.entries(PROFILES).map(([id, profile]) => Object.freeze({ id, ...profile })); }
