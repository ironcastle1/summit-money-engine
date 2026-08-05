import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPasscode(passcode, salt = randomBytes(16).toString('hex')) {
  const digest = scryptSync(String(passcode || ''), salt, 32).toString('hex');
  return { salt, digest };
}

export function verifyPasscode(passcode, record = {}) {
  if (!record?.salt || !record?.digest) return false;
  const expected = Buffer.from(record.digest, 'hex');
  const actual = scryptSync(String(passcode || ''), record.salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
