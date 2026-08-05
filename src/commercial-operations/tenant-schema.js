import { TENANT_SEGMENTS, TENANT_STATES } from './constants.js';
import { commercialId } from './ids.js';
import { clean, frozen, unique } from './utilities.js';
export function tenantRecord(input = {}) {
    const state = String(input.state || 'TRIAL').toUpperCase();
    const segment = String(input.segment || 'SELF_SERVE').toUpperCase();
    if (!TENANT_STATES.includes(state))
        throw new TypeError(`Unsupported tenant state: ${state}`);
    if (!TENANT_SEGMENTS.includes(segment))
        throw new TypeError(`Unsupported tenant segment: ${segment}`);
    const now = new Date().toISOString();
    return frozen({ id: clean(input.id, 190) || commercialId('tenant', input.name), name: clean(input.name || 'New workspace', 180), legalName: clean(input.legalName || input.name, 240), state, segment, planId: String(input.planId || 'FREE').toUpperCase(), ownerUserId: clean(input.ownerUserId, 190), billingEmail: clean(input.billingEmail, 320).toLowerCase(), countryCode: clean(input.countryCode, 3).toUpperCase(), industry: clean(input.industry, 120), domains: unique(input.domains || [], 50), tags: unique(input.tags || [], 100), settings: frozen({ dataRegion: 'UK', retentionDays: 365, ...(input.settings || {}) }), createdAt: input.createdAt || now, updatedAt: now });
}
