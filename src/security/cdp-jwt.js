import { createPrivateKey, randomBytes, sign } from 'node:crypto';

function encode(value) { return Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url'); }

export function createCdpJwt(options, now = Date.now()) {
  const method = String(options.method || 'GET').toUpperCase();
  const host = String(options.host || '').trim();
  const path = String(options.path || '').trim();
  const keyId = String(options.keyId || '').trim();
  const secretText = String(options.keySecret || '').replace(/\\n/g, '\n').trim();
  if (!method || !host || !path || !keyId || !secretText) throw new Error('CDP JWT configuration is incomplete');
  const issuedAt = Math.floor(now / 1000);
  const header = { alg: 'ES256', typ: 'JWT', kid: keyId, nonce: randomBytes(16).toString('hex') };
  const payload = { sub: keyId, iss: 'cdp', aud: ['cdp_service'], nbf: issuedAt, iat: issuedAt, exp: issuedAt + Number(options.expiresIn || 120), uri: `${method} ${host}${path}` };
  const unsigned = `${encode(header)}.${encode(payload)}`;
  const key = createPrivateKey(secretText);
  const signature = sign('sha256', Buffer.from(unsigned), { key, dsaEncoding: 'ieee-p1363' });
  return `${unsigned}.${signature.toString('base64url')}`;
}
