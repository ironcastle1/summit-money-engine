import test from 'node:test';
import assert from 'node:assert/strict';
import { VerificationGapAnalyzer } from '../../src/intelligence-processing/verification-gap-analyzer.js';
import { EscalationDetector } from '../../src/intelligence-processing/escalation-detector.js';
import { SourceBiasAuditor } from '../../src/intelligence-processing/source-bias-audit.js';
import { LocationDisambiguator } from '../../src/intelligence-processing/location-disambiguator.js';
test('verification gap analysis identifies missing independent evidence and coordinates', () => {
    const result = new VerificationGapAnalyzer().analyse({ id: 'e1', sourceIds: ['a'], claims: [], entities: [], records: [{ id: 'r1' }] });
    assert.ok(result.gaps.some(item => item.type === 'INDEPENDENT_CONFIRMATION'));
    assert.ok(result.gaps.some(item => item.type === 'PRECISE_LOCATION'));
    assert.ok(result.verificationScore < 60);
});
test('verification gap analysis marks well-evidenced events complete', () => {
    const result = new VerificationGapAnalyzer().analyse({ id: 'e1', sourceIds: ['a', 'b'], coordinate: { lat: 1, lon: 2 }, timestamp: new Date().toISOString(), claims: [{ type: 'QUANTITY' }, { type: 'STATUS' }], entities: [{ type: 'ORGANISATION' }], records: [{ url: 'https://example.com' }] });
    assert.equal(result.complete, true);
    assert.equal(result.verificationScore, 100);
});
test('escalation detector measures worsening impact and status changes', () => {
    const detector = new EscalationDetector();
    const result = detector.evaluate({ status: 'ESCALATING', materiality: { score: 80 }, deaths: 30, injured: 100, sourceIds: ['a', 'b', 'c'], impact: { domains: [{}, {}, {}] }, updatedAt: '2026-08-04T12:00:00Z', crossBorderImpact: true }, { status: 'ONGOING', materiality: { score: 50 }, deaths: 5, injured: 10, sourceIds: ['a'], impact: { domains: [{}] }, updatedAt: '2026-08-04T08:00:00Z' });
    assert.equal(result.escalating, true);
    assert.ok(result.score >= 50);
    assert.ok(result.reasons.includes('cross-border impact emerged'));
});
test('source bias and location disambiguation expose analytical context', () => {
    const audit = new SourceBiasAuditor().audit([{ sourceId: 'a', title: 'Security threat and military operation' }, { sourceId: 'b', title: 'Aid groups assist displaced civilians' }]);
    assert.equal(audit.sourceCount, 2);
    assert.ok(Object.keys(audit.frameCoverage).length >= 2);
    const location = new LocationDisambiguator().disambiguate('Kiev', { countryCode: 'UA' });
    assert.equal(location.resolved, true);
    assert.equal(location.place.name, 'Kyiv');
});
