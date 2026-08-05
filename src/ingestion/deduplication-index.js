import { recordFingerprint, similarityTokens, jaccardSimilarity } from './record-fingerprint.js';

function timeBucket(value, bucketMs) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.floor(timestamp / bucketMs) : 0;
}

export class DeduplicationIndex {
  #exact = new Map();
  #semantic = new Map();

  constructor(options = {}) {
    this.bucketMs = Math.max(60_000, Number(options.bucketMs || 6 * 60 * 60_000));
    this.similarityThreshold = Math.max(0, Math.min(1, Number(options.similarityThreshold ?? 0.82)));
    this.maximumCandidates = Math.max(10, Number(options.maximumCandidates || 500));
  }

  add(envelope) {
    const fingerprint = recordFingerprint(envelope);
    const existing = this.#exact.get(fingerprint);
    if (existing) return { duplicate: true, kind: 'EXACT', canonical: existing, fingerprint, similarity: 1 };

    const record = envelope.record || {};
    const category = String(record.category || envelope.recordType || 'record').toLowerCase();
    const bucket = timeBucket(envelope.observedAt, this.bucketMs);
    const key = `${category}:${bucket}`;
    const tokens = similarityTokens(record);
    const candidates = [...(this.#semantic.get(key) || []), ...(this.#semantic.get(`${category}:${bucket - 1}`) || [])].slice(-this.maximumCandidates);
    let best = null;
    for (const candidate of candidates) {
      const similarity = jaccardSimilarity(tokens, candidate.tokens);
      if (!best || similarity > best.similarity) best = { candidate, similarity };
    }
    if (best && best.similarity >= this.similarityThreshold) {
      return { duplicate: true, kind: 'SEMANTIC', canonical: best.candidate.envelope, fingerprint, similarity: best.similarity };
    }

    this.#exact.set(fingerprint, envelope);
    const entries = this.#semantic.get(key) || [];
    entries.push({ envelope, tokens });
    if (entries.length > this.maximumCandidates) entries.splice(0, entries.length - this.maximumCandidates);
    this.#semantic.set(key, entries);
    return { duplicate: false, kind: null, canonical: envelope, fingerprint, similarity: 0 };
  }

  clear() { this.#exact.clear(); this.#semantic.clear(); }

  stats() {
    return {
      exactEntries: this.#exact.size,
      semanticBuckets: this.#semantic.size,
      semanticEntries: [...this.#semantic.values()].reduce((sum, entries) => sum + entries.length, 0)
    };
  }
}
