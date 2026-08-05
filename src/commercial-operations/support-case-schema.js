import { SUPPORT_SEVERITIES, SUPPORT_STATES } from './constants.js';
import { commercialId } from './ids.js';
import { clean, frozen, unique } from './utilities.js';
export function supportCaseRecord(input = {}) { const state = String(input.state || 'OPEN').toUpperCase(); const severity = String(input.severity || 'SEV3').toUpperCase(); if (!SUPPORT_STATES.includes(state))
    throw new TypeError(`Unsupported support state: ${state}`); if (!SUPPORT_SEVERITIES.includes(severity))
    throw new TypeError(`Unsupported support severity: ${severity}`); const now = new Date().toISOString(); return frozen({ id: clean(input.id, 190) || commercialId('case', input.title), tenantId: clean(input.tenantId, 190), title: clean(input.title || 'Support request', 240), description: clean(input.description, 10000), state, severity, category: clean(input.category || 'GENERAL', 120).toUpperCase(), requester: clean(input.requester, 320), assignee: clean(input.assignee, 190), tags: unique(input.tags || [], 100), acknowledgedAt: input.acknowledgedAt || null, firstResponseAt: input.firstResponseAt || null, resolvedAt: input.resolvedAt || null, createdAt: input.createdAt || now, updatedAt: now }); }
