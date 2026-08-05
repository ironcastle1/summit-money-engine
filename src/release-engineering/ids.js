import { createHash, randomUUID } from 'node:crypto';
import { clean } from './utilities.js';
export function releaseId(prefix, label = '') { const slug = clean(label, 100).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); return `${prefix}-${slug ? `${slug}-` : ''}${randomUUID().slice(0, 12)}`.slice(0, 190); }
export function stableReleaseId(prefix, ...parts) { return `${prefix}-${createHash('sha256').update(parts.map(String).join('|')).digest('hex').slice(0, 20)}`; }
export function digest(value) { return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex'); }
