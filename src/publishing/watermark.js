import { createHash } from 'node:crypto';
import { clean, frozen } from './utilities.js';

export function watermarkRecord(input = {}) {
  const recipient = clean(input.recipient || input.email || input.subscriberId || 'recipient', 320);
  const editionId = clean(input.editionId, 190);
  const issuedAt = input.issuedAt || new Date().toISOString();
  const fingerprint = createHash('sha256').update(`${recipient}|${editionId}|${issuedAt}`).digest('hex').slice(0, 20);
  return frozen({
    text: clean(input.text || `${recipient} · ${editionId} · ${issuedAt}`, 500),
    recipient,
    editionId,
    issuedAt,
    fingerprint
  });
}
