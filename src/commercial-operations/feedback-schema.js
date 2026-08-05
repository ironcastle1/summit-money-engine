import { FEEDBACK_TYPES } from './constants.js';
import { commercialId } from './ids.js';
import { clean, clamp, frozen, unique } from './utilities.js';
export function feedbackRecord(input = {}) { const type = String(input.type || 'IDEA').toUpperCase(); if (!FEEDBACK_TYPES.includes(type))
    throw new TypeError(`Unsupported feedback type: ${type}`); const now = new Date().toISOString(); return frozen({ id: clean(input.id, 190) || commercialId('feedback', type), tenantId: clean(input.tenantId, 190), userId: clean(input.userId, 190), type, score: input.score === undefined ? null : clamp(input.score, 0, type === 'NPS' ? 10 : 5), text: clean(input.text, 10000), tags: unique(input.tags || [], 100), featureKey: clean(input.featureKey, 160), state: String(input.state || 'NEW').toUpperCase(), createdAt: input.createdAt || now, updatedAt: now }); }
