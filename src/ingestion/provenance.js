import { stableId } from '../core/ids.js';

function safeUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch { return null; }
}

function clean(value, max = 300) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function createProvenance(input = {}) {
  const sourceId = clean(input.sourceId, 64).toLowerCase();
  const recordId = clean(input.recordId, 120);
  const retrievedAt = new Date(input.retrievedAt || Date.now()).toISOString();
  const sourceUrl = safeUrl(input.sourceUrl);
  const id = stableId('provenance', sourceId, recordId, sourceUrl || '', retrievedAt);
  return Object.freeze({
    id,
    sourceId,
    recordId,
    sourceRecordId: clean(input.sourceRecordId, 220) || null,
    sourceUrl,
    retrievedAt,
    publishedAt: input.publishedAt ? new Date(input.publishedAt).toISOString() : null,
    attribution: clean(input.attribution, 240) || sourceId,
    license: clean(input.license, 120) || 'unspecified',
    mode: clean(input.mode, 32).toUpperCase() || 'LIVE',
    transformationChain: Object.freeze((input.transformationChain || []).map(item => clean(item, 120)).filter(Boolean).slice(0, 50)),
    contentHash: clean(input.contentHash, 128) || null,
    confidence: Math.max(0, Math.min(1, Number(input.confidence ?? 1))),
    metadata: Object.freeze({ ...(input.metadata || {}) })
  });
}

export function provenanceFromEnvelope(envelope, descriptor, options = {}) {
  return createProvenance({
    sourceId: descriptor.id,
    recordId: envelope.id,
    sourceRecordId: envelope.externalId,
    sourceUrl: options.sourceUrl || envelope.record.url,
    publishedAt: envelope.observedAt,
    retrievedAt: envelope.retrievedAt,
    attribution: descriptor.attribution,
    license: descriptor.license,
    mode: descriptor.mode,
    transformationChain: options.transformationChain,
    contentHash: options.contentHash,
    confidence: options.confidence,
    metadata: { group: descriptor.group, ...options.metadata }
  });
}
