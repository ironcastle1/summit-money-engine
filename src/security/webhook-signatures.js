import { createHmac, timingSafeEqual } from 'node:crypto';

function equalHex(a, b) {
  try {
    const left = Buffer.from(String(a || ''), 'hex');
    const right = Buffer.from(String(b || ''), 'hex');
    return left.length > 0 && left.length === right.length && timingSafeEqual(left, right);
  } catch { return false; }
}

function parseSignature(value) {
  return Object.fromEntries(String(value || '').split(',').map(part => part.trim().split('=', 2)).filter(pair => pair.length === 2));
}

export function verifyStripeSignature(rawBody, header, secret, toleranceSeconds = 300, now = Date.now()) {
  const parts = String(header || '').split(',').map(value => value.trim());
  const timestamp = Number(parts.find(value => value.startsWith('t='))?.slice(2));
  const signatures = parts.filter(value => value.startsWith('v1=')).map(value => value.slice(3));
  if (!Number.isFinite(timestamp) || Math.abs(now / 1000 - timestamp) > toleranceSeconds) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  return signatures.some(value => equalHex(value, expected));
}

export function verifyCoinbaseSignature(rawBody, header, secret, requestHeaders = {}, toleranceSeconds = 300, now = Date.now()) {
  const parsed = parseSignature(header);
  const timestamp = Number(parsed.t);
  if (!Number.isFinite(timestamp) || Math.abs(now / 1000 - timestamp) > toleranceSeconds) return false;
  const v0 = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  if (parsed.v0 && equalHex(parsed.v0, v0)) return true;
  if (!parsed.v1 || !parsed.h) return false;
  const names = parsed.h.split(/\s+/).filter(Boolean);
  const values = names.map(name => String(requestHeaders[name.toLowerCase()] || '')).join('.');
  const v1 = createHmac('sha256', secret).update(`${timestamp}.${parsed.h}.${values}.${rawBody}`).digest('hex');
  return equalHex(parsed.v1, v1);
}
