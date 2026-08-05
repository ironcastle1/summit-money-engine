import { cargoProfile } from './cargo-profile.js';
import { vesselProfile } from './vessel-profile.js';
export function cargoCompatibility(cargoClass, vesselClass, segment = {}) {
  const cargo = cargoProfile(cargoClass); const vessel = vesselProfile(vesselClass); const reasons = [];
  if (cargo.id === 'CONTAINERS' && vessel.capacityTeu <= 0) reasons.push('Vessel class does not carry standard containers');
  if (['CRUDE', 'REFINED'].includes(cargo.id) && !['AFRAMAX', 'SUEZMAX', 'VLCC', 'GENERAL_CARGO'].includes(vessel.id)) reasons.push('Vessel class is not configured as a tanker');
  if (cargo.id === 'LNG' && vessel.id !== 'LNG') reasons.push('LNG cargo requires an LNG carrier');
  if (cargo.id === 'LPG' && !['LPG', 'GENERAL_CARGO'].includes(vessel.id)) reasons.push('LPG cargo requires an LPG-capable vessel');
  if (segment.restrictions?.maximumDraftM && vessel.draftM > Number(segment.restrictions.maximumDraftM)) reasons.push('Vessel draft exceeds segment limit');
  if (segment.restrictions?.panamaCompatibleOnly && !vessel.canalCompatible) reasons.push('Vessel exceeds canal compatibility limit');
  return Object.freeze({ compatible: reasons.length === 0, reasons: Object.freeze(reasons), cargo, vessel });
}
