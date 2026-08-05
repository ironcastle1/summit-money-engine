import { SEAT_ROLES } from './constants.js';
import { commercialId } from './ids.js';
import { clean, frozen } from './utilities.js';
export function seatRecord(input = {}) { const role = String(input.role || 'VIEWER').toUpperCase(); if (!SEAT_ROLES.includes(role))
    throw new TypeError(`Unsupported seat role: ${role}`); const now = new Date().toISOString(); return frozen({ id: clean(input.id, 190) || commercialId('seat', input.email), tenantId: clean(input.tenantId, 190), userId: clean(input.userId, 190), email: clean(input.email, 320).toLowerCase(), name: clean(input.name, 180), role, active: input.active !== false, lastActiveAt: input.lastActiveAt || null, createdAt: input.createdAt || now, updatedAt: now }); }
