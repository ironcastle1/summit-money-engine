import { stableId } from '../core/ids.js';
import { toIso, toTimestamp } from '../core/time.js';
import { RecordValidationError } from './errors.js';

function cleanText(value, maximum = 500) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maximum);
}

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function createRecordEnvelope(input = {}) {
  const sourceId = cleanText(input.sourceId, 64).toLowerCase();
  const recordType = cleanText(input.recordType || 'event', 48).toLowerCase();
  const observedAt = toTimestamp(input.observedAt ?? input.updatedAt ?? input.time ?? Date.now());
  const retrievedAt = toTimestamp(input.retrievedAt ?? Date.now());
  if (!sourceId) throw new RecordValidationError('Envelope sourceId is required');
  if (observedAt === null || retrievedAt === null) throw new RecordValidationError('Envelope timestamps are invalid');
  const externalId = cleanText(input.externalId ?? input.sourceRecordId ?? input.record?.sourceId ?? input.record?.id, 220);
  const id = input.id || stableId('record', sourceId, recordType, externalId || JSON.stringify(input.record || input.payload || {}));
  return Object.freeze({
    id,
    sourceId,
    externalId: externalId || null,
    recordType,
    observedAt: toIso(observedAt),
    retrievedAt: toIso(retrievedAt),
    schemaVersion: Math.max(1, Math.floor(Number(input.schemaVersion || 1))),
    record: Object.freeze({ ...plainObject(input.record || input.payload) }),
    sourceMetadata: Object.freeze({ ...plainObject(input.sourceMetadata) }),
    processing: Object.freeze({ ...plainObject(input.processing) })
  });
}

export function withProcessing(envelope, patch = {}) {
  return Object.freeze({
    ...envelope,
    processing: Object.freeze({ ...envelope.processing, ...patch })
  });
}
