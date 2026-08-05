import { ENTITY_TYPES } from './constants.js';
import { canonicalName, stableTextKey } from './text-normalizer.js';
import { normalizeCoordinate } from './geo-utils.js';
export function createEntity(input = {}) {
    const type = ENTITY_TYPES.includes(String(input.type).toUpperCase()) ? String(input.type).toUpperCase() : 'ORGANISATION';
    const name = String(input.name || input.label || '').trim();
    if (!name)
        throw new TypeError('Entity name is required');
    const canonical = canonicalName(input.canonicalName || name);
    const aliases = [...new Set([name, ...(input.aliases || [])].map(value => String(value).trim()).filter(Boolean))];
    const identifiers = Object.fromEntries(Object.entries(input.identifiers || {}).filter(([, value]) => value !== null && value !== undefined && value !== ''));
    return Object.freeze({
        id: String(input.id || `ent_${type.toLowerCase()}_${stableTextKey(`${type}:${canonical}`).slice(4)}`),
        type, name, canonicalName: canonical, aliases, identifiers,
        coordinate: normalizeCoordinate(input.coordinate || input),
        countryCode: input.countryCode ? String(input.countryCode).toUpperCase() : null,
        attributes: { ...(input.attributes || {}) },
        evidence: [...new Set(input.evidence || [])],
        confidence: clampScore(input.confidence ?? 50),
        createdAt: input.createdAt || new Date().toISOString(),
        updatedAt: input.updatedAt || new Date().toISOString()
    });
}
export function validateEntity(entity) {
    const errors = [];
    if (!entity?.id)
        errors.push('id');
    if (!ENTITY_TYPES.includes(entity?.type))
        errors.push('type');
    if (!entity?.name)
        errors.push('name');
    if (!entity?.canonicalName)
        errors.push('canonicalName');
    return { valid: errors.length === 0, errors };
}
export function mergeEntities(left, right) {
    const a = createEntity(left);
    const b = createEntity(right);
    if (a.type !== b.type)
        throw new TypeError('Cannot merge entities of different types');
    const conflicting = Object.keys(a.identifiers).some(key => b.identifiers[key] && b.identifiers[key] !== a.identifiers[key]);
    if (conflicting)
        throw new TypeError('Cannot merge entities with conflicting identifiers');
    const preferred = a.confidence >= b.confidence ? a : b;
    return createEntity({
        ...preferred,
        aliases: [...new Set([...a.aliases, ...b.aliases])],
        identifiers: { ...a.identifiers, ...b.identifiers },
        evidence: [...new Set([...a.evidence, ...b.evidence])],
        attributes: { ...a.attributes, ...b.attributes },
        coordinate: preferred.coordinate || a.coordinate || b.coordinate,
        confidence: Math.min(100, Math.max(a.confidence, b.confidence) + Math.min(a.confidence, b.confidence) * 0.08),
        createdAt: a.createdAt < b.createdAt ? a.createdAt : b.createdAt,
        updatedAt: new Date().toISOString()
    });
}
function clampScore(value) { return Math.max(0, Math.min(100, Number(value) || 0)); }
