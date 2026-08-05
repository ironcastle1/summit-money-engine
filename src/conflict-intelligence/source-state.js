import {
  SOURCE_STATES
}
from './constants.js';
export function sourceState(value,
fallback = 'UNAVAILABLE') {
  const state = String(value || fallback).toUpperCase();
  return SOURCE_STATES.includes(state) ? state : fallback;
}
export function sourceStateWeight(value) {
  return {
    MEASURED: 1,
    CORROBORATED: .94,
    REFERENCE: .72,
    INFERRED: .52,
    UNAVAILABLE: 0
  }
  [sourceState(value)] || 0;
}
export function disclosure(value) {
  const state = sourceState(value);
  return {
    MEASURED: 'Directly measured source record.',
    CORROBORATED: 'Supported by independent source records.',
    REFERENCE: 'Static reference information.',
    INFERRED: 'Derived from available evidence.',
    UNAVAILABLE: 'No usable source was available.'
  }
  [state];
}
