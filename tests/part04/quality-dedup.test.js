import test from 'node:test';
import assert from 'node:assert/strict';
import { SemanticDeduplicator } from '../../src/intelligence-processing/semantic-deduplicator.js';
import { EvidenceQualityEvaluator } from '../../src/intelligence-processing/evidence-quality.js';
import { SourceReputationRegistry } from '../../src/intelligence-processing/source-reputation.js';
import { ManipulationRiskModel } from '../../src/intelligence-processing/manipulation-risk.js';
test('semantic deduplicator retains canonical records and identifies near duplicates', () => {
    const deduplicator = new SemanticDeduplicator({ nearThreshold: 0.6 });
    const result = deduplicator.deduplicate([
        { id: 'a', title: 'Suez Canal closes after grounded ship', summary: 'Traffic is halted.', timestamp: '2026-08-04T10:00:00Z', coordinate: { lat: 30.4, lon: 32.3 } },
        { id: 'b', title: 'Grounded vessel shuts the Suez Canal', summary: 'Canal traffic has stopped.', timestamp: '2026-08-04T10:15:00Z', coordinate: { lat: 30.45, lon: 32.35 } },
        { id: 'c', title: 'Election campaign begins in Canada', summary: 'Parties release manifestos.', timestamp: '2026-08-04T10:15:00Z', coordinate: { lat: 45, lon: -75 } }
    ]);
    assert.equal(result.records.length, 2);
    assert.equal(result.duplicates.length, 1);
    assert.equal(result.duplicates[0].canonicalId, 'a');
});
test('evidence quality rewards traceable primary evidence and penalizes vague reports', () => {
    const evaluator = new EvidenceQualityEvaluator();
    const strong = evaluator.evaluate({ title: 'Official agency statement confirms outage', summary: 'Sensor data and a government filing confirm the event.', url: 'https://agency.example/report', timestamp: new Date().toISOString(), coordinate: { lat: 1, lon: 2 }, sourceReliability: 85 });
    const weak = evaluator.evaluate({ title: 'Unverified rumour reportedly circulating', source: { type: 'SOCIAL', verified: false } });
    assert.ok(strong.score > weak.score);
    assert.equal(strong.primarySourceLikely, true);
});
test('source reputation updates from confirmed and false outcomes', () => {
    const registry = new SourceReputationRegistry([{ id: 'source', reliability: 60 }]);
    registry.recordOutcome('source', 'CONFIRMED', 5);
    const improved = registry.get('source').reliability;
    registry.recordOutcome('source', 'FALSE', 10);
    assert.ok(registry.get('source').reliability < improved);
    assert.equal(registry.snapshot().sources, 1);
});
test('manipulation model identifies coordinated emotional virality prompts', () => {
    const model = new ManipulationRiskModel();
    const high = model.evaluate({ title: 'SHOCKING!!! Share this everywhere before it is deleted!!!', source: { type: 'SOCIAL' } }, { nearDuplicateCount: 20, independentSourceCount: 1 });
    const low = model.evaluate({ title: 'Official port authority publishes revised schedule', url: 'https://port.example/schedule', source: { type: 'OFFICIAL' } });
    assert.equal(high.level, 'HIGH');
    assert.ok(high.score > low.score);
});
