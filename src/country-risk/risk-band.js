import {
  RISK_BANDS
}
from './constants.js';
import {
  clamp
}
from './numbers.js';
export function riskBand(score) {
  const value = clamp(score);
  return RISK_BANDS.find(band => value >= band.minimum && value <= band.maximum) || RISK_BANDS.at(-1);
}
export function riskDirection(delta) {
  const value = Number(delta) || 0;
  return value >= 5 ? 'DETERIORATING' : value <= -5 ? 'IMPROVING' : 'STABLE';
}
