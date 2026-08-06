import { clamp } from './utilities.js';

export function sessionRisk(input = {}) {
  let score = 0;
  const signals = [];
  const add = (points, code) => { score += points; signals.push(code); };
  if (input.newDevice) add(18, 'NEW_DEVICE');
  if (input.impossibleTravel) add(50, 'IMPOSSIBLE_TRAVEL');
  if (input.anonymousNetwork) add(24, 'ANONYMOUS_NETWORK');
  if (input.failedAttempts >= 5) add(Math.min(35, Number(input.failedAttempts) * 4), 'REPEATED_FAILURES');
  if (input.privilegedAction) add(12, 'PRIVILEGED_ACTION');
  if (input.unmanagedDevice) add(18, 'UNMANAGED_DEVICE');
  if (input.countryChanged) add(15, 'COUNTRY_CHANGED');
  if (input.staleSession) add(10, 'STALE_SESSION');
  score = clamp(score);
  return Object.freeze({ score, band: score >= 80 ? 'CRITICAL' : score >= 55 ? 'HIGH' : score >= 30 ? 'ELEVATED' : 'NORMAL', signals: Object.freeze(signals) });
}
