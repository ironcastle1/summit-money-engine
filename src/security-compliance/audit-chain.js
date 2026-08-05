import { securityAuditEvent } from './audit-event.js';

export function appendAuditEvent(chain = [], input = {}) {
  const previousHash = chain.length ? chain[chain.length - 1].hash : 'GENESIS';
  return Object.freeze([...chain, securityAuditEvent(input, previousHash)]);
}

export function verifyAuditChain(chain = []) {
  let previousHash = 'GENESIS';
  for (let index = 0; index < chain.length; index += 1) {
    const event = chain[index];
    const expected = securityAuditEvent({ ...event, id: event.id, at: event.at }, previousHash);
    if (event.previousHash !== previousHash || event.hash !== expected.hash) {
      return Object.freeze({ valid: false, index, eventId: event.id, reason: 'HASH_CHAIN_MISMATCH' });
    }
    previousHash = event.hash;
  }
  return Object.freeze({ valid: true, checked: chain.length, head: previousHash });
}
