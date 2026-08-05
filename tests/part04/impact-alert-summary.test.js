import test from 'node:test';
import assert from 'node:assert/strict';
import { ImpactPropagationModel } from '../../src/intelligence-processing/impact-propagation.js';
import { AlertCandidateGenerator } from '../../src/intelligence-processing/alert-candidate-generator.js';
import { EventSummarizer } from '../../src/intelligence-processing/event-summarizer.js';
import { FreshnessModel } from '../../src/intelligence-processing/freshness-model.js';
test('impact propagation maps primary disruption into secondary domains', () => {
    const result = new ImpactPropagationModel().propagate([{ domain: 'SHIPPING', score: 90 }]);
    const domains = result.domains.map(item => item.domain);
    assert.ok(domains.includes('SHIPPING'));
    assert.ok(domains.includes('SUPPLY_CHAIN'));
    assert.ok(domains.includes('ECONOMIC'));
    assert.ok(result.paths.length > 0);
});
test('alert candidates honour materiality, confidence and domain preferences', () => {
    const generator = new AlertCandidateGenerator();
    const alerts = generator.generate([{ id: 'e1', title: 'Port closed', timestamp: new Date().toISOString(), status: 'ESCALATING', materiality: { score: 85, reasons: ['strategic port closed'] }, confidence: { score: 80 }, impact: { domains: [{ domain: 'SHIPPING' }] } }], { minimumMateriality: 60, minimumConfidence: 60, domains: ['SHIPPING'], channels: ['IN_APP'] });
    assert.equal(alerts.length, 1);
    assert.ok(alerts[0].channels.includes('PUSH'));
    assert.ok(['HIGH', 'IMMEDIATE'].includes(alerts[0].priority));
});
test('event summarizer produces a concise brief and operational bullets', () => {
    const summary = new EventSummarizer().summarize({ id: 'e1', title: 'Suez Canal traffic halted', summary: 'A grounded vessel blocked the canal. Officials confirmed that tug boats are responding. Container queues are increasing.', locationName: 'Suez Canal', status: 'CONFIRMED', materiality: { level: 'MATERIAL', score: 75 }, confidence: { label: 'HIGH', score: 82 }, sourceIds: ['a', 'b'] });
    assert.match(summary.headline, /Suez/);
    assert.ok(summary.brief.length > 20);
    assert.ok(summary.bullets.some(item => item.startsWith('Location:')));
});
test('freshness model applies category-specific decay', () => {
    const now = Date.parse('2026-08-04T12:00:00Z');
    const fresh = new FreshnessModel().score({ category: 'market', timestamp: '2026-08-04T11:00:00Z' }, now);
    const stale = new FreshnessModel().score({ category: 'market', timestamp: '2026-08-03T00:00:00Z' }, now);
    assert.ok(fresh.score > stale.score);
    assert.equal(fresh.state, 'FRESH');
});
