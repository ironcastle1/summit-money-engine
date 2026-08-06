import { CLASSIFICATIONS } from './constants.js';

const rules = {
  PUBLIC: { rank: 1, encryptionRequired: false, externalSharing: true, watermark: false, defaultRetentionDays: 3650 },
  INTERNAL: { rank: 2, encryptionRequired: true, externalSharing: false, watermark: false, defaultRetentionDays: 2555 },
  CONFIDENTIAL: { rank: 3, encryptionRequired: true, externalSharing: false, watermark: true, defaultRetentionDays: 1825 },
  RESTRICTED: { rank: 4, encryptionRequired: true, externalSharing: false, watermark: true, defaultRetentionDays: 365 }
};

export function classificationRule(value) {
  const id = CLASSIFICATIONS.includes(String(value || '').toUpperCase()) ? String(value).toUpperCase() : 'INTERNAL';
  return Object.freeze({ id, ...rules[id] });
}

export function clearanceAllows(clearance, classification) {
  return classificationRule(clearance).rank >= classificationRule(classification).rank;
}
