import test from 'node:test';
import assert from 'node:assert/strict';
import { recordSimilarity } from '../../src/intelligence-processing/cluster-similarity.js';
import { EventClusterer } from '../../src/intelligence-processing/event-clusterer.js';
import { EventFusionEngine } from '../../src/intelligence-processing/event-fusion-engine.js';
test('record similarity combines text, entities, time and distance', () => {
    const a = { title: 'Suez Canal blocked by grounded vessel', timestamp: '2026-08-04T10:00:00Z', coordinate: { lat: 30.4, lon: 32.3 }, category: 'transport', entities: [{ id: 'suez' }] };
    const b = { title: 'Grounded ship blocks the Suez canal', timestamp: '2026-08-04T11:00:00Z', coordinate: { lat: 30.45, lon: 32.35 }, category: 'transport', entities: [{ id: 'suez' }] };
    const c = { title: 'Election results announced in Brazil', timestamp: '2026-08-04T11:00:00Z', coordinate: { lat: -15, lon: -47 }, category: 'political', entities: [] };
    assert.ok(recordSimilarity(a, b).score > recordSimilarity(a, c).score);
});
test('event clusterer groups related reports and separates unrelated events', () => {
    const records = [
        { id: 'a', title: 'Suez Canal blocked by grounded vessel', timestamp: '2026-08-04T10:00:00Z', coordinate: { lat: 30.4, lon: 32.3 }, category: 'transport' },
        { id: 'b', title: 'Grounded vessel blocks Suez Canal', timestamp: '2026-08-04T11:00:00Z', coordinate: { lat: 30.45, lon: 32.35 }, category: 'transport' },
        { id: 'c', title: 'Wildfire reported in California', timestamp: '2026-08-04T11:00:00Z', coordinate: { lat: 36, lon: -119 }, category: 'wildfire' }
    ];
    const clusters = new EventClusterer({ threshold: 0.45 }).cluster(records);
    assert.equal(clusters.length, 2);
    assert.ok(clusters.some(cluster => cluster.records.length === 2));
});
test('fusion preserves magnitude, attributes, entities and source evidence', () => {
    const cluster = { id: 'c1', records: [
            { id: 'r1', sourceId: 'a', source: { id: 'a' }, title: 'Earthquake hits port', summary: 'A major earthquake affected the port.', timestamp: '2026-08-04T10:00:00Z', coordinate: { lat: 35, lon: 36 }, category: 'earthquake', magnitude: 6.8, entities: [{ id: 'port', type: 'PORT', name: 'Port' }], claims: [], attributes: { portImpact: true } },
            { id: 'r2', sourceId: 'b', source: { id: 'b' }, title: 'Port damaged in earthquake', summary: 'Damage was confirmed.', timestamp: '2026-08-04T10:10:00Z', coordinate: { lat: 35.1, lon: 36.1 }, category: 'earthquake', magnitude: 6.7, entities: [{ id: 'port', type: 'PORT', name: 'Port' }], claims: [], attributes: { infrastructureOutage: true } }
        ] };
    const event = new EventFusionEngine().fuse(cluster);
    assert.equal(event.magnitude, 6.8);
    assert.equal(event.sourceIds.length, 2);
    assert.equal(event.recordIds.length, 2);
    assert.equal(event.entities.length, 1);
    assert.equal(event.attributes.portImpact, true);
});
