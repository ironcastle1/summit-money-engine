import test from 'node:test';
import assert from 'node:assert/strict';
import { DecisionLog } from '../../src/intelligence-processing/decision-log.js';
import { ProcessingBatch } from '../../src/intelligence-processing/processing-batch.js';
import { RetentionPolicy } from '../../src/intelligence-processing/retention-policy.js';
import { GeospatialClusterer } from '../../src/intelligence-processing/geospatial-clusterer.js';
import { CrossDomainLinker } from '../../src/intelligence-processing/cross-domain-linker.js';
import { SignalExtractor } from '../../src/intelligence-processing/signal-extractor.js';
import { GeocodingContextResolver } from '../../src/intelligence-processing/geocoding-context.js';
test('decision log records and reverses explainable processing decisions', () => {
    const log = new DecisionLog();
    const decision = log.record({ subjectId: 'e1', processor: 'gate', decision: 'FILTER', score: 40, threshold: 52, factors: ['below threshold'] });
    const reversal = log.reverse(decision.id, 'new evidence', 'analyst');
    assert.equal(log.forSubject('e1').length, 2);
    assert.equal(reversal.metadata.reversedDecisionId, decision.id);
});
test('processing batches partition work and enforce terminal state', () => {
    const batch = new ProcessingBatch({ maximum: 5 });
    batch.addMany([{ id: 1 }, { id: 2 }, { id: 3 }]);
    assert.equal(batch.partition(2).length, 2);
    assert.equal(batch.close({ success: true }).state, 'COMPLETE');
    assert.throws(() => batch.add({ id: 4 }), /COMPLETE/);
});
test('retention policy and geospatial clustering classify stored intelligence', () => {
    const policy = new RetentionPolicy();
    assert.equal(policy.retentionDays({ materiality: { level: 'CRITICAL' } }), 730);
    const clusters = new GeospatialClusterer({ radiusKm: 50 }).cluster([
        { id: 'a', coordinate: { lat: 51.5, lon: 0 } },
        { id: 'b', coordinate: { lat: 51.6, lon: 0.1 } },
        { id: 'c', coordinate: { lat: 40, lon: -74 } }
    ]);
    assert.equal(clusters.length, 2);
    assert.equal(clusters[0].members.length, 2);
});
test('cross-domain links, signals and geocoding expose operational relationships', () => {
    const linker = new CrossDomainLinker();
    const links = linker.link([
        { id: 'war', category: 'conflict', timestamp: '2026-08-04T10:00:00Z', coordinate: { lat: 30, lon: 32 }, entities: [{ id: 'suez' }], impact: { domains: [{ domain: 'MILITARY' }, { domain: 'SHIPPING' }] } },
        { id: 'market', category: 'market', timestamp: '2026-08-04T11:00:00Z', coordinate: { lat: 30.1, lon: 32.1 }, entities: [{ id: 'suez' }], impact: { domains: [{ domain: 'SHIPPING' }, { domain: 'MARKET' }] } }
    ], { threshold: 0.2 });
    assert.equal(links.length, 1);
    const signals = new SignalExtractor().extract({ id: 'r1', sourceId: 'a', title: 'Official port closure halted 25 vessels' });
    assert.ok(signals.some(item => item.type === 'CLOSURE'));
    assert.ok(signals.some(item => item.type === 'QUANTITATIVE'));
    const geocoded = new GeocodingContextResolver().resolve({ locationName: 'Damascus' });
    assert.equal(geocoded.label, 'Damascus');
    assert.ok(geocoded.confidence > 50);
});
