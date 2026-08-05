import { FEATURE_ROLLOUTS } from './constants.js';
import { commercialId } from './ids.js';
import { clean, clamp, frozen, unique } from './utilities.js';
export function featureFlagRecord(input = {}) { const rollout = String(input.rollout || 'OFF').toUpperCase(); if (!FEATURE_ROLLOUTS.includes(rollout))
    throw new TypeError(`Unsupported rollout mode: ${rollout}`); const now = new Date().toISOString(); return frozen({ id: clean(input.id, 190) || commercialId('flag', input.key), key: clean(input.key || input.name, 160).toUpperCase().replace(/[^A-Z0-9_]/g, '_'), name: clean(input.name || input.key, 180), description: clean(input.description, 2000), rollout, percentage: clamp(input.percentage), tenantIds: unique(input.tenantIds || [], 5000), planIds: unique(input.planIds || [], 20).map(value => String(value).toUpperCase()), active: input.active !== false, createdAt: input.createdAt || now, updatedAt: now }); }
