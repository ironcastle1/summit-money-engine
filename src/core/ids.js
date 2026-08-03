import { createHash, randomUUID } from 'node:crypto';

export function requestId(headerValue) {
  const candidate = String(headerValue || '').trim();
  return /^[a-zA-Z0-9._:-]{8,128}$/.test(candidate) ? candidate : randomUUID();
}

export function stableId(namespace, ...parts) {
  const hash = createHash('sha256');
  hash.update(namespace);
  for (const part of parts) hash.update(`\u0000${String(part ?? '')}`);
  return `${namespace}-${hash.digest('hex').slice(0, 20)}`;
}
