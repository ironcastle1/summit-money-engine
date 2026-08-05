import { clamp } from './utilities.js';

export function riskScore(input = {}) {
  const likelihood = clamp(input.likelihood ?? 50);
  const impact = clamp(input.impact ?? 50);
  const velocity = clamp(input.velocity ?? 50);
  const controlStrength = clamp(input.controlStrength ?? 0);
  const inherent = clamp(likelihood * 0.45 + impact * 0.45 + velocity * 0.10);
  const residual = clamp(inherent * (1 - controlStrength / 125));
  return Object.freeze({
    likelihood,
    impact,
    velocity,
    controlStrength,
    inherent: Math.round(inherent),
    residual: Math.round(residual),
    band: residual >= 80 ? 'CRITICAL' : residual >= 60 ? 'HIGH' : residual >= 35 ? 'MEDIUM' : 'LOW'
  });
}
