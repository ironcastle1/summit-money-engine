import { createHash } from 'node:crypto';
function stable(value) {
    if (Array.isArray(value))
        return `[${value.map(stable).join(',')}]`;
    if (value && typeof value === 'object')
        return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
    return JSON.stringify(value);
}
export function stableFeatureId(feature, namespace = 'feature') {
    if (feature?.id !== undefined && feature?.id !== null && String(feature.id))
        return String(feature.id);
    const payload = { geometry: feature?.geometry || null, properties: feature?.properties || null };
    return `${namespace}:${createHash('sha256').update(stable(payload)).digest('hex').slice(0, 20)}`;
}
export function assignFeatureId(feature, namespace) { return Object.freeze({ ...feature, id: stableFeatureId(feature, namespace) }); }
