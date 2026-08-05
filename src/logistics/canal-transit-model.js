import { clamp, round } from './numbers.js';

const CANALS = Object.freeze({
  SUEZ: Object.freeze({
    baseHours: 14,
    baseFeeUsd: 320000,
    maximumDraftM: 20.1,
    maximumBeamM: 77.5,
    queueSensitivity: 1.35
  }),
  PANAMA: Object.freeze({
    baseHours: 11,
    baseFeeUsd: 420000,
    maximumDraftM: 15.2,
    maximumBeamM: 51.25,
    queueSensitivity: 1.6
  }),
  KIEL: Object.freeze({
    baseHours: 8,
    baseFeeUsd: 45000,
    maximumDraftM: 9.5,
    maximumBeamM: 32.5,
    queueSensitivity: 0.8
  }),
  CORINTH: Object.freeze({
    baseHours: 3,
    baseFeeUsd: 18000,
    maximumDraftM: 8,
    maximumBeamM: 24.6,
    queueSensitivity: 0.6
  })
});

export function canalProfile(id) {
  return CANALS[String(id || '').trim().toUpperCase()] || null;
}

export function canalTransitEstimate(input = {}) {
  const profile = canalProfile(input.canalId);
  if (!profile) {
    return Object.freeze({
      available: false,
      reason: 'UNKNOWN_CANAL',
      canalId: String(input.canalId || '').toUpperCase()
    });
  }

  const draftM = Math.max(0, Number(input.draftM || 0));
  const beamM = Math.max(0, Number(input.beamM || 0));
  const queueVessels = clamp(Number(input.queueVessels || 0), 0, 500);
  const reservationPremiumPct = clamp(Number(input.reservationPremiumPct || 0), 0, 500);
  const droughtRestriction = clamp(Number(input.droughtRestrictionPct || 0), 0, 100);

  const compatible = draftM <= profile.maximumDraftM && (!beamM || beamM <= profile.maximumBeamM);
  const queueHours = queueVessels * profile.queueSensitivity;
  const restrictionHours = droughtRestriction / 100 * profile.baseHours * 1.8;
  const transitHours = profile.baseHours + queueHours + restrictionHours;
  const feeUsd = profile.baseFeeUsd * (1 + reservationPremiumPct / 100);

  return Object.freeze({
    available: true,
    compatible,
    canalId: String(input.canalId).toUpperCase(),
    transitHours: round(transitHours, 1),
    queueHours: round(queueHours, 1),
    restrictionHours: round(restrictionHours, 1),
    feeUsd: round(feeUsd, 2),
    limits: Object.freeze({
      maximumDraftM: profile.maximumDraftM,
      maximumBeamM: profile.maximumBeamM
    })
  });
}

export function canalProfiles() {
  return Object.entries(CANALS).map(([id, profile]) => Object.freeze({ id, ...profile }));
}
