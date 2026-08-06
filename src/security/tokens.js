import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

function base64url(value) { return Buffer.from(value).toString('base64url'); }
function decode(value) { return Buffer.from(String(value), 'base64url').toString('utf8'); }
function signature(secret, value) { return createHmac('sha256', secret).update(value).digest('base64url'); }

export function randomToken(bytes = 32) { return randomBytes(bytes).toString('base64url'); }
export function tokenHash(token, secret) { return createHmac('sha256', secret).update(String(token)).digest('hex'); }

export function signPayload(payload, secret, options = {}) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const body = base64url(JSON.stringify({ ...payload, iat: issuedAt, exp: issuedAt + Number(options.ttlSeconds || 3600) }));
  return `${body}.${signature(secret, body)}`;
}

export function verifySignedPayload(token, secret, now = Date.now()) {
  const [body, supplied] = String(token || '').split('.');
  if (!body || !supplied) return null;
  const expected = signature(secret, body);
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(decode(body));
    if (!Number.isFinite(payload.exp) || payload.exp * 1000 <= now) return null;
    return payload;
  } catch { return null; }
}
