import { createHmac, timingSafeEqual } from 'node:crypto';

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function decode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function signShareToken(payload, secret) {
  const body = encode(JSON.stringify(payload));
  const signature = createHmac('sha256', String(secret || 'merlin-local-share-secret')).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyShareToken(token, secret) {
  const [body, signature] = String(token || '').split('.');
  if (!body || !signature) return null;
  const expected = createHmac('sha256', String(secret || 'merlin-local-share-secret')).update(body).digest();
  let actual;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try { return JSON.parse(decode(body)); } catch { return null; }
}
