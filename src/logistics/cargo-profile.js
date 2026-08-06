import { CARGO_CLASSES } from './constants.js';
import { enumValue } from './validation.js';
const PROFILES = Object.freeze({
  CONTAINERS: { handlingFactor: 1.0, insuranceFactor: 1.0, perishability: 0.15, hazard: 0.10, preferredModes: ['SEA', 'RAIL', 'ROAD'] },
  DRY_BULK: { handlingFactor: 0.72, insuranceFactor: 0.72, perishability: 0.05, hazard: 0.16, preferredModes: ['SEA', 'RAIL'] },
  CRUDE: { handlingFactor: 0.62, insuranceFactor: 1.22, perishability: 0, hazard: 0.82, preferredModes: ['SEA', 'PIPELINE'] },
  REFINED: { handlingFactor: 0.75, insuranceFactor: 1.30, perishability: 0, hazard: 0.72, preferredModes: ['SEA', 'PIPELINE', 'ROAD'] },
  LNG: { handlingFactor: 1.15, insuranceFactor: 1.55, perishability: 0, hazard: 0.90, preferredModes: ['SEA', 'PIPELINE'] },
  LPG: { handlingFactor: 1.05, insuranceFactor: 1.45, perishability: 0, hazard: 0.84, preferredModes: ['SEA', 'PIPELINE', 'ROAD'] },
  REFRIGERATED: { handlingFactor: 1.38, insuranceFactor: 1.28, perishability: 0.95, hazard: 0.08, preferredModes: ['SEA', 'AIR', 'ROAD'] },
  VEHICLES: { handlingFactor: 1.18, insuranceFactor: 1.16, perishability: 0, hazard: 0.08, preferredModes: ['SEA', 'RAIL', 'ROAD'] },
  PROJECT: { handlingFactor: 1.70, insuranceFactor: 1.42, perishability: 0, hazard: 0.28, preferredModes: ['SEA', 'ROAD'] },
  HAZARDOUS: { handlingFactor: 1.62, insuranceFactor: 1.85, perishability: 0.12, hazard: 1.0, preferredModes: ['SEA', 'RAIL', 'ROAD'] },
  GENERAL: { handlingFactor: 1.0, insuranceFactor: 1.0, perishability: 0.05, hazard: 0.10, preferredModes: ['SEA', 'RAIL', 'ROAD', 'AIR'] }
});
export function cargoProfile(id = 'GENERAL', overrides = {}) {
  const normalized = enumValue(id, CARGO_CLASSES, 'cargoClass');
  return Object.freeze({ id: normalized, ...PROFILES[normalized], ...overrides });
}
export function cargoProfiles() { return Object.entries(PROFILES).map(([id, profile]) => Object.freeze({ id, ...profile, preferredModes: [...profile.preferredModes] })); }
