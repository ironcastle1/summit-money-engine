import test from 'node:test';
import assert from 'node:assert/strict';
import { ImpactClassifier } from '../../src/intelligence-processing/impact-classifier.js';
import { MaterialityPolicy } from '../../src/intelligence-processing/materiality-policy.js';
import { EarthquakePolicy } from '../../src/intelligence-processing/earthquake-policy.js';
import { RelevanceRanker } from '../../src/intelligence-processing/relevance-ranker.js';
test('impact classifier maps text to multiple operational domains', () => {
    const impact = new ImpactClassifier().classify({ title: 'Missile strike closes oil port and disrupts tanker shipping', summary: 'Power infrastructure was damaged.' });
    const domains = impact.domains.map(item => item.domain);
    assert.ok(domains.includes('MILITARY'));
    assert.ok(domains.includes('ENERGY'));
    assert.ok(domains.includes('SHIPPING'));
    assert.ok(domains.includes('INFRASTRUCTURE'));
});
test('materiality policy elevates severe national and strategic disruption', () => {
    const result = new MaterialityPolicy().evaluate({ deaths: 100, nationalImpact: true, strategicAsset: true, confidence: { score: 80, independentSourceCount: 3 } }, { domains: [{ domain: 'ENERGY', score: 90, weight: 1.2 }] });
    assert.equal(result.material, true);
    assert.ok(['MATERIAL', 'CRITICAL'].includes(result.level));
    assert.ok(result.score >= 52);
});
test('earthquake policy hides routine tremors and shows major impact events', () => {
    const policy = new EarthquakePolicy();
    assert.equal(policy.evaluate({ category: 'earthquake', magnitude: 3.2 }).show, false);
    assert.equal(policy.evaluate({ category: 'earthquake', magnitude: 6.8 }).show, true);
    assert.equal(policy.evaluate({ category: 'earthquake', magnitude: 5.9, nearPopulation: true }).show, true);
    assert.equal(policy.evaluate({ category: 'earthquake', magnitude: 5.1, shippingImpact: true }).show, true);
});
test('relevance ranking blends query, proximity, confidence and materiality', () => {
    const ranker = new RelevanceRanker();
    const events = [
        { id: 'near', title: 'Oil port disruption', timestamp: new Date().toISOString(), coordinate: { lat: 51.5, lon: 0 }, confidence: { score: 80 }, materiality: { score: 80 } },
        { id: 'far', title: 'Unrelated festival', timestamp: '2020-01-01T00:00:00Z', coordinate: { lat: -30, lon: 140 }, confidence: { score: 30 }, materiality: { score: 20 } }
    ];
    const ranked = ranker.rank(events, { query: 'oil port disruption', coordinate: { lat: 51.5, lon: -0.1 }, radiusKm: 500 });
    assert.equal(ranked[0].id, 'near');
    assert.ok(ranked[0].relevance.score > ranked[1].relevance.score);
});
