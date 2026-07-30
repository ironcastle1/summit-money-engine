import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const DEFAULT_COST = 16_384;

export async function hashPassword(password, options = {}) {
  const salt = options.salt || randomBytes(16).toString('hex');
  const cost = Number(options.cost || DEFAULT_COST);
  const blockSize = Number(options.blockSize || 8);
  const parallelization = Number(options.parallelization || 1);
  const derived = await scrypt(String(password), salt, KEY_LENGTH, { N: cost, r: blockSize, p: parallelization, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${cost}$${blockSize}$${parallelization}$${salt}$${Buffer.from(derived).toString('hex')}`;
}

export async function verifyPassword(password, encoded) {
  const parts = String(encoded || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, costText, blockText, parallelText, salt, digestHex] = parts;
  const expected = Buffer.from(digestHex, 'hex');
  if (expected.length !== KEY_LENGTH) return false;
  const actual = await scrypt(String(password), salt, KEY_LENGTH, {
    N: Number(costText), r: Number(blockText), p: Number(parallelText), maxmem: 64 * 1024 * 1024
  });
  return timingSafeEqual(expected, Buffer.from(actual));
}

export function passwordHashNeedsUpgrade(encoded) {
  const parts = String(encoded || '').split('$');
  return parts.length !== 6 || parts[0] !== 'scrypt' || Number(parts[1]) < DEFAULT_COST;
}
