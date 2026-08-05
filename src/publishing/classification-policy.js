import { CLASSIFICATIONS } from './constants.js';
const RANK = Object.freeze(Object.fromEntries(CLASSIFICATIONS.map((value, index) => [value, index])));

export function classificationRank(value) {
  return RANK[String(value || 'PUBLIC').toUpperCase()] ?? 0;
}

export function canReceiveClassification(clearance, classification) {
  return classificationRank(clearance) >= classificationRank(classification);
}

export function maximumClassification(values = []) {
  return [...values].map(value => String(value || 'PUBLIC').toUpperCase()).sort((a, b) => classificationRank(b) - classificationRank(a))[0] || 'PUBLIC';
}
