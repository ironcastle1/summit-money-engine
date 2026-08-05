import { INVITATION_STATES, SEAT_ROLES } from './constants.js';
import { commercialId } from './ids.js';
import { addDays, iso } from './time.js';
import { clean, frozen } from './utilities.js';
export function invitationRecord(input = {}) { const state = String(input.state || 'PENDING').toUpperCase(); const role = String(input.role || 'VIEWER').toUpperCase(); if (!INVITATION_STATES.includes(state))
    throw new TypeError(`Unsupported invitation state: ${state}`); if (!SEAT_ROLES.includes(role))
    throw new TypeError(`Unsupported invitation role: ${role}`); const now = iso(); return frozen({ id: clean(input.id, 190) || commercialId('invite', input.email), tenantId: clean(input.tenantId, 190), email: clean(input.email, 320).toLowerCase(), role, state, invitedBy: clean(input.invitedBy, 190), token: clean(input.token || commercialId('token'), 240), expiresAt: input.expiresAt || addDays(now, 7).toISOString(), acceptedAt: input.acceptedAt || null, createdAt: input.createdAt || now, updatedAt: now }); }
