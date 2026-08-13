import crypto from 'node:crypto';
export function sha256(value){ return crypto.createHash('sha256').update(String(value)).digest('hex'); }
export function stableId(prefix, ...parts){ return `${prefix}-${sha256(parts.join('|')).slice(0,20)}`; }
