import { createHash, randomUUID } from 'node:crypto';
import { clean, stableStringify } from './utilities.js';
export function slug(value, fallback = 'item') {
    const result = clean(value, 180).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return result || fallback;
}
export function makeId(prefix, value = '') {
    const suffix = value ? slug(value) : randomUUID();
    return `${prefix}-${suffix}`.slice(0, 190);
}
export function fingerprint(value, prefix = '') {
    return `${prefix}${createHash('sha256').update(stableStringify(value)).digest('hex')}`;
}
