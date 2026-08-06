import test from 'node:test';
import assert from 'node:assert/strict';
import { ScenarioSeedGenerator } from '../../src/intelligence-processing/scenario-seed-generator.js';
import { VerificationGapAnalyzer } from '../../src/intelligence-processing/verification-gap-analyzer.js';
import { EscalationDetector } from '../../src/intelligence-processing/escalation-detector.js';
import { LocationDisambiguator } from '../../src/intelligence-processing/location-disambiguator.js';
test('scenario seed generator creates bounded operational hypotheses', () => {
    const scenarios = new ScenarioSeedGenerator().generate({ id: 'e1', status: 'ESCALATING', materiality: { score: 85 }, confidence: { score: 80 }, impact: { domains: [{ domain: 'SHIPPING' }, { domain: 'ENERGY' }] } });
    assert.ok(scenarios.length >= 6);
    assert.ok(scenarios.every(item => item.probability >= 0.03 && item.probability <= 0.95));
    assert.ok(scenarios.every(item => item.indicators.length >= 3));
});
test('scenario probabilities increase for severe escalating events', () => {
    const generator = new ScenarioSeedGenerator();
    const base = generator.generate({ id: 'a', materiality: { score: 50 }, confidence: { score: 50 }, impact: { domains: [{ domain: 'SHIPPING' }] } });
    const severe = generator.generate({ id: 'b', status: 'ESCALATING', crossBorderImpact: true, materiality: { score: 90 }, confidence: { score: 90 }, impact: { domains: [{ domain: 'SHIPPING' }] } });
    assert.ok(severe[0].probability > base[0].probability);
});
test('gap comparison ranks least verified event first', () => {
    const analyzer = new VerificationGapAnalyzer();
    const ranked = analyzer.compare([{ id: 'complete', sourceIds: ['a', 'b'], coordinate: { lat: 1, lon: 2 }, timestamp: new Date().toISOString(), claims: [{ type: 'QUANTITY' }, { type: 'STATUS' }], entities: [{ type: 'PERSON' }], records: [{ url: 'https://example.com' }] }, { id: 'weak', sourceIds: [], claims: [], entities: [], records: [] }]);
    assert.equal(ranked[0].eventId, 'weak');
});
test('detectors return safe defaults when context is unavailable', () => {
    assert.equal(new EscalationDetector().evaluate({ id: 'e1' }, null).escalating, false);
    const unknown = new LocationDisambiguator().disambiguate('A place that does not exist');
    assert.equal(unknown.resolved, false);
    assert.equal(unknown.place, null);
});
