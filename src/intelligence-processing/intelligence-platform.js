import { IntelligencePipeline } from './intelligence-pipeline.js';
import { ProcessingRepositories } from './repositories.js';
export class IntelligenceProcessingPlatform {
    constructor(options = {}) { this.pipeline = options.pipeline || new IntelligencePipeline(options); this.repositories = options.repositories || new ProcessingRepositories(options.maximums); this.lastRun = null; }
    process(records, context = {}) { const startedAt = new Date().toISOString(); const result = this.pipeline.run(records, context); this.repositories.records.setMany(result.records); this.repositories.events.setMany(result.events); this.repositories.entities.setMany(result.entities); this.repositories.narratives.setMany(result.narratives); this.lastRun = { startedAt, completedAt: new Date().toISOString(), inputCount: records.length, recordCount: result.records.length, eventCount: result.events.length, materialCount: result.materialEvents.length, narrativeCount: result.narratives.length }; return result; }
    status() { return { ready: true, lastRun: this.lastRun, repositories: this.repositories.snapshot(), resolver: this.pipeline.entities.snapshot(), provenance: this.pipeline.provenance.snapshot(), metrics: this.pipeline.metrics.snapshot(), generatedAt: new Date().toISOString() }; }
    materialEvents(options = {}) { return this.repositories.events.list({ limit: options.limit || 100, predicate: event => event.visible && (!options.category || event.category === options.category), sort: (a, b) => (b.relevance?.score || 0) - (a.relevance?.score || 0) }); }
    event(id) { return this.repositories.events.get(id); }
    entity(id) { return this.repositories.entities.get(id) || this.pipeline.entities.get(id); }
    narrative(id) { return this.repositories.narratives.get(id); }
    resolveEntity(input) { const result = this.pipeline.entities.add(input); this.repositories.entities.set(result.entity); return result; }
    corroborate(claims, sources = {}) { return this.pipeline.corroboration.assess(claims, id => sources[id] || { id }); }
}
