import { createRecordEnvelope, withProcessing } from './record-envelope.js';
import { provenanceFromEnvelope } from './provenance.js';
import { contentHash } from './record-fingerprint.js';

export class NormalizationPipeline {
  #stages = [];
  constructor(options = {}) {
    this.schemaRegistry = options.schemaRegistry;
    this.deduplication = options.deduplication;
    this.provenance = options.provenance;
    this.deadLetters = options.deadLetters;
  }

  use(name, transform) {
    if (typeof transform !== 'function') throw new TypeError('Pipeline transform must be a function');
    this.#stages.push({ name: String(name || `stage-${this.#stages.length + 1}`), transform });
    return this;
  }

  async process(rawRecord, context) {
    const transformations = [];
    try {
      let envelope = createRecordEnvelope({
        sourceId: context.descriptor.id,
        recordType: context.recordType,
        externalId: context.externalId?.(rawRecord),
        observedAt: context.observedAt?.(rawRecord),
        retrievedAt: context.retrievedAt,
        schemaVersion: context.schemaVersion || 1,
        record: context.normalize ? await context.normalize(rawRecord, context) : rawRecord,
        sourceMetadata: context.sourceMetadata
      });

      for (const stage of this.#stages) {
        const startedAt = performance.now();
        const transformed = await stage.transform(envelope, context);
        if (transformed) envelope = transformed.record ? transformed : withProcessing(envelope, { [stage.name]: transformed });
        transformations.push({ name: stage.name, durationMs: Number((performance.now() - startedAt).toFixed(3)) });
      }

      const schema = this.schemaRegistry?.validate(envelope, { allowUnknown: true }) || { valid: true, issues: [] };
      if (!schema.valid) {
        const deadLetter = this.deadLetters?.add({ sourceId: context.descriptor.id, stage: 'validation', issues: schema.issues, rawRecord });
        return { state: 'REJECTED', envelope, issues: schema.issues, deadLetter };
      }

      const duplicate = this.deduplication?.add(envelope) || { duplicate: false, fingerprint: contentHash(envelope.record) };
      const provenance = provenanceFromEnvelope(envelope, context.descriptor, {
        sourceUrl: context.sourceUrl?.(rawRecord),
        transformationChain: transformations.map(item => item.name),
        contentHash: duplicate.fingerprint,
        confidence: context.confidence?.(rawRecord) ?? 1,
        metadata: { processingDurations: transformations }
      });
      this.provenance?.add(provenance);

      if (duplicate.duplicate) {
        return { state: 'DUPLICATE', envelope, canonical: duplicate.canonical, duplicate, provenance };
      }
      return { state: 'ACCEPTED', envelope, provenance, transformations };
    } catch (error) {
      const deadLetter = this.deadLetters?.add({ sourceId: context.descriptor.id, stage: 'normalization', error: { name: error.name, code: error.code, message: error.message }, rawRecord });
      return { state: 'REJECTED', error, deadLetter, transformations };
    }
  }

  describe() { return this.#stages.map(stage => stage.name); }
}
