import { INCIDENT_STATES } from './constants.js';
import { commercialId } from './ids.js';
import { clean, frozen, unique } from './utilities.js';
export function statusIncidentRecord(input = {}) { const state = String(input.state || 'INVESTIGATING').toUpperCase(); if (!INCIDENT_STATES.includes(state))
    throw new TypeError(`Unsupported incident state: ${state}`); const now = new Date().toISOString(); return frozen({ id: clean(input.id, 190) || commercialId('incident', input.title), title: clean(input.title || 'Service incident', 240), state, severity: String(input.severity || 'MINOR').toUpperCase(), componentIds: unique(input.componentIds || [], 100), message: clean(input.message, 5000), startedAt: input.startedAt || now, resolvedAt: input.resolvedAt || null, updates: Object.freeze([...(input.updates || [])]), createdAt: input.createdAt || now, updatedAt: now }); }
