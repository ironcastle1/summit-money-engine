import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecord } from '../../src/intelligence-processing/record-normalizer.js';
import { IntelligencePipeline } from '../../src/intelligence-processing/intelligence-pipeline.js';
import { IntelligenceProcessingPlatform } from '../../src/intelligence-processing/intelligence-platform.js';
test('record normalizer creates a safe common schema', () => {
    const record = normalizeRecord({ sourceId: 'Reuters', headline: 'Port closes', date: '2026-08-04T10:00:00Z', lat: 30, lon: 32, url: 'javascript:alert(1)' });
    assert.equal(record.sourceId, 'reuters');
    assert.equal(record.title, 'Port closes');
    assert.deepEqual(record.coordinate, { lat: 30, lon: 32 });
    assert.equal(record.url, null);
});
test('pipeline normalizes, extracts, fuses and ranks material events', () => {
    const records = [
        { id: 'r1', sourceId: 'reuters', source: { id: 'reuters', domain: 'reuters.com', reliability: 85 }, title: 'Magnitude 7.1 earthquake damages Suez Canal infrastructure', summary: 'A major earthquake killed 20 people and halted tanker shipping at the Suez Canal.', timestamp: '2026-08-04T10:00:00Z', category: 'earthquake', magnitude: 7.1, coordinate: { lat: 30.45, lon: 32.35 }, deaths: 20, shippingImpact: true, strategicAsset: true, attributes: { shippingImpact: true, strategicAsset: true } },
        { id: 'r2', sourceId: 'bbc', source: { id: 'bbc', domain: 'bbc.co.uk', reliability: 80 }, title: 'Suez shipping halted after magnitude 7.1 earthquake', summary: 'Canal infrastructure is damaged and 20 deaths are reported.', timestamp: '2026-08-04T10:05:00Z', category: 'earthquake', magnitude: 7.1, coordinate: { lat: 30.46, lon: 32.34 }, deaths: 20, attributes: { shippingImpact: true, strategicAsset: true } }
    ];
    const result = new IntelligencePipeline().run(records, { query: 'Suez shipping' });
    assert.equal(result.records.length, 2);
    assert.equal(result.events.length, 1);
    assert.equal(result.materialEvents.length, 1);
    assert.equal(result.materialEvents[0].earthquakeDecision.show, true);
    assert.ok(result.materialEvents[0].relevance.score > 0);
});
test('platform exposes stored entities, events and status after a run', () => {
    const platform = new IntelligenceProcessingPlatform();
    const result = platform.process([{ id: 'r1', sourceId: 'a', title: 'National power grid outage closes airport and port', summary: 'The outage affects the whole country and shipping.', category: 'infrastructure', nationalImpact: true, strategicAsset: true, attributes: { nationalImpact: true, strategicAsset: true }, timestamp: new Date().toISOString() }]);
    assert.equal(platform.status().lastRun.inputCount, 1);
    assert.equal(platform.event(result.events[0].id).id, result.events[0].id);
    assert.ok(platform.status().repositories.records.size >= 1);
});
