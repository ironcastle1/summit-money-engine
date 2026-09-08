import crypto from 'node:crypto';

export function id(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
