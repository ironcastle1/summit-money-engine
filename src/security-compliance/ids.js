import { createHash, randomUUID } from 'node:crypto';
import { clean } from './utilities.js';

export function securityId(prefix, label = '') {
  const slug = clean(label, 120).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${prefix}-${slug ? `${slug}-` : ''}${randomUUID().slice(0, 12)}`.slice(0, 190);
}

export function stableSecurityId(prefix, ...parts) {
  const digest = createHash('sha256').update(parts.map(String).join('|')).digest('hex').slice(0, 20);
  return `${prefix}-${digest}`;
}

export function fingerprint(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
}
