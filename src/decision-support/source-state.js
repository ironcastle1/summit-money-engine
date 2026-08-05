import { SOURCE_STATES } from './constants.js';
export function sourceState(value, fallback = 'UNAVAILABLE') {
  const state = String(value || fallback).toUpperCase();
  return SOURCE_STATES.includes(state) ? state : fallback;
}
export function sourceWeight(value) {
  return { MEASURED: 1, CORROBORATED: 0.95, REFERENCE: 0.7, INFERRED: 0.5, UNAVAILABLE: 0 }[sourceState(value)] || 0;
}
export function disclosure(value) {
  return {
    MEASURED: 'Direct source record.',
    CORROBORATED: 'Supported by independent records.',
    REFERENCE: 'Static reference information.',
    INFERRED: 'Derived from available evidence.',
    UNAVAILABLE: 'No usable source was available.'
  }[sourceState(value)];
}
