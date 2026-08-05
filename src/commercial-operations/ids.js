import { randomUUID, createHash } from 'node:crypto';
import { clean } from './utilities.js';
export function slug(value, fallback = 'item') {
    const normalized = clean(value, 180).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return normalized || fallback;
}
export function commercialId(prefix, label = '') {
    return `${prefix}-${label ? `${slug(label)}-` : ''}${randomUUID().slice(0, 12)}`.slice(0, 190);
}
export function stableBucket(value, buckets = 100) {
    const hex = createHash('sha256').update(String(value || '')).digest('hex').slice(0, 8);
    return Number.parseInt(hex, 16) % Math.max(1, Number(buckets) || 100);
}
