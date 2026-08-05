import { normalizeRecord } from './record-normalizer.js';
import { EntityExtractor } from './entity-extractor.js';
import { EntityResolver } from './entity-resolver.js';
import { ClaimExtractor } from './claim-extractor.js';
import { EventClusterer } from './event-clusterer.js';
import { EventFusionEngine } from './event-fusion-engine.js';
import { CorroborationEngine } from './corroboration-engine.js';
import { ConfidenceModel } from './confidence-model.js';
import { ImpactClassifier } from './impact-classifier.js';
import { MaterialityPolicy } from './materiality-policy.js';
import { EarthquakePolicy } from './earthquake-policy.js';
import { RelevanceRanker } from './relevance-ranker.js';
import { NarrativeClusterer } from './narrative-clusterer.js';
import { ProvenanceLedger } from './provenance-ledger.js';
import { ProcessingMetrics } from './processing-metrics.js';
import { EvidenceQualityEvaluator } from './evidence-quality.js';
import { ManipulationRiskModel } from './manipulation-risk.js';
import { SignalExtractor } from './signal-extractor.js';
import { FreshnessModel } from './freshness-model.js';
import { ImpactPropagationModel } from './impact-propagation.js';
import { EventSummarizer } from './event-summarizer.js';
import { EventLifecycleTracker } from './event-lifecycle.js';
import { DecisionLog } from './decision-log.js';
import { SourceReputationRegistry } from './source-reputation.js';
import { explainEvent } from './explainability.js';
export class IntelligencePipeline {
    constructor(options = {}) {
        this.entities = options.entityResolver || new EntityResolver();
        this.entityExtractor = options.entityExtractor || new EntityExtractor();
        this.claimExtractor = options.claimExtractor || new ClaimExtractor();
        this.clusterer = options.clusterer || new EventClusterer();
        this.fusion = options.fusion || new EventFusionEngine();
        this.corroboration = options.corroboration || new CorroborationEngine();
        this.confidence = options.confidence || new ConfidenceModel();
        this.impact = options.impact || new ImpactClassifier();
        this.materiality = options.materiality || new MaterialityPolicy();
        this.earthquakes = options.earthquakes || new EarthquakePolicy();
        this.ranker = options.ranker || new RelevanceRanker();
        this.narratives = options.narratives || new NarrativeClusterer();
        this.provenance = options.provenance || new ProvenanceLedger();
        this.metrics = options.metrics || new ProcessingMetrics();
        this.evidenceQuality = options.evidenceQuality || new EvidenceQualityEvaluator();
        this.manipulationRisk = options.manipulationRisk || new ManipulationRiskModel();
        this.signals = options.signals || new SignalExtractor();
        this.freshness = options.freshness || new FreshnessModel();
        this.propagation = options.propagation || new ImpactPropagationModel();
        this.summarizer = options.summarizer || new EventSummarizer();
        this.lifecycle = options.lifecycle || new EventLifecycleTracker();
        this.decisions = options.decisions || new DecisionLog();
        this.sourceReputation = options.sourceReputation || new SourceReputationRegistry();
    }
    run(inputs = [], context = {}) {
        const stop = this.metrics.timer('pipeline.run');
        const records = this.#prepareRecords(inputs);
        const clusters = this.clusterer.cluster(records);
        const sourceLookup = id => records.find(record => record.sourceId === id)?.source || { id };
        let events = clusters.map(cluster => this.#processCluster(cluster, sourceLookup));
        events = this.ranker.rank(events, context);
        for (const event of events) {
            event.explanation = explainEvent(event);
            this.lifecycle.observe(event);
        }
        const visible = events.filter(event => event.visible);
        const narratives = this.narratives.cluster(visible);
        this.metrics.increment('events.fused', events.length);
        this.metrics.increment('events.visible', visible.length);
        this.metrics.increment('events.filtered', events.length - visible.length);
        this.metrics.increment('narratives.created', narratives.length);
        stop();
        return {
            records,
            clusters,
            events,
            materialEvents: visible,
            filteredEvents: events.filter(event => !event.visible),
            narratives,
            entities: this.entities.list(),
            generatedAt: new Date().toISOString(),
            metrics: this.metrics.snapshot(),
            decisions: this.decisions.snapshot()
        };
    }
    #prepareRecords(inputs) {
        const records = [];
        for (const input of inputs) {
            try {
                const record = normalizeRecord(input, { sourceId: input.sourceId, keepRaw: false });
                if (record.source?.id) {
                    this.sourceReputation.register({
                        ...record.source,
                        id: record.source.id,
                        reliability: record.sourceReliability ?? record.source.reliability ?? 50
                    });
                }
                const extracted = this.entityExtractor.extract(record);
                const resolved = extracted.map(entity => this.entities.add(entity).entity);
                const claims = this.claimExtractor.extract({ ...record, entities: resolved });
                const evidenceQuality = this.evidenceQuality.evaluate(record);
                const signals = this.signals.extract(record);
                const enriched = {
                    ...record,
                    sourceReliability: record.sourceReliability ?? this.sourceReputation.get(record.sourceId).reliability,
                    entities: resolved,
                    claims,
                    signals,
                    evidenceQuality
                };
                records.push(enriched);
                this.metrics.increment('records.accepted');
                this.metrics.increment('claims.extracted', claims.length);
                this.metrics.increment('entities.extracted', resolved.length);
                this.metrics.increment('signals.extracted', signals.length);
                this.provenance.append({
                    recordId: record.id,
                    outputId: record.id,
                    sourceId: record.sourceId,
                    operation: 'NORMALISE',
                    attributes: { evidenceQuality: evidenceQuality.score }
                });
            }
            catch (error) {
                this.metrics.increment('records.rejected');
            }
        }
        return records;
    }
    #processCluster(cluster, sourceLookup) {
        const fused = this.fusion.fuse(cluster);
        const corroboration = this.corroboration.assess(fused.claims, sourceLookup);
        const manipulation = this.manipulationRisk.evaluate(fused, {
            nearDuplicateCount: cluster.records.length,
            independentSourceCount: corroboration.independentSourceCount,
            contradictionScore: corroboration.contradiction.severity * 100
        });
        const confidence = this.confidence.score({
            sourceReliability: average(cluster.records.map(record => record.sourceReliability || 50)),
            corroborationScore: corroboration.score,
            completenessScore: completeness(fused),
            specificityScore: specificity(fused),
            contradictionScore: corroboration.contradiction.severity * 100,
            manipulationRisk: manipulation.score,
            timestamp: fused.updatedAt
        });
        const impact = this.impact.classify(fused);
        const impactPropagation = this.propagation.propagate(impact.domains);
        const materiality = this.materiality.evaluate({
            ...fused,
            confidence: { ...corroboration, ...confidence }
        }, impact);
        const earthquakeDecision = this.earthquakes.evaluate(fused);
        const visible = materiality.material && earthquakeDecision.show;
        const event = {
            ...fused,
            confidence: { ...corroboration, ...confidence },
            impact,
            impactPropagation,
            materiality,
            manipulationRisk: manipulation,
            earthquakeDecision,
            freshness: this.freshness.score(fused),
            visible
        };
        event.generatedSummary = this.summarizer.summarize(event);
        this.decisions.record({
            subjectId: event.id,
            processor: 'material-event-gate',
            decision: visible ? 'SHOW' : 'FILTER',
            score: materiality.score,
            threshold: this.materiality.materialThreshold,
            factors: [...materiality.reasons, ...(earthquakeDecision.reasons || [])],
            evidenceIds: event.recordIds
        });
        this.provenance.append({
            outputId: event.id,
            operation: 'FUSE_EVENT',
            inputs: event.recordIds,
            attributes: {
                clusterId: event.clusterId,
                materialityScore: materiality.score,
                visible
            }
        });
        return event;
    }
}
function average(values) {
    const numbers = values.map(Number).filter(Number.isFinite);
    return numbers.length ? numbers.reduce((left, right) => left + right, 0) / numbers.length : 50;
}
function completeness(event) {
    let score = 20;
    for (const field of ['title', 'summary', 'timestamp', 'coordinate', 'category']) {
        if (event[field])
            score += 12;
    }
    score += Math.min(20, (event.entities?.length || 0) * 4);
    return Math.min(100, score);
}
function specificity(event) {
    let score = 30;
    if (event.coordinate)
        score += 20;
    if (event.entities?.length)
        score += 20;
    if (event.claims?.some(claim => claim.type === 'QUANTITY'))
        score += 20;
    if (event.locationName)
        score += 10;
    return Math.min(100, score);
}
