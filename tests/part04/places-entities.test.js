import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPlaceIndex } from '../../src/intelligence-processing/place-index.js';
import { EntityExtractor } from '../../src/intelligence-processing/entity-extractor.js';
import { EntityResolver } from '../../src/intelligence-processing/entity-resolver.js';
import { createEntity, mergeEntities } from '../../src/intelligence-processing/entity-schema.js';
import { EntityGraph } from '../../src/intelligence-processing/entity-graph.js';
test('place index resolves English and local aliases with context', () => {
    const index = defaultPlaceIndex();
    assert.equal(index.resolve('Kiev')[0].place.name, 'Kyiv');
    assert.equal(index.resolve('دمشق')[0].place.name, 'Damascus');
    assert.equal(index.resolve('Washington', { countryCode: 'US' })[0].place.countryCode, 'US');
});
test('entity extractor identifies places, organisations, people and commodities', () => {
    const extractor = new EntityExtractor();
    const entities = extractor.extract({ id: 'r1', title: 'President Smith met the Energy Ministry in Kyiv as crude oil prices rose.' });
    assert.ok(entities.some(item => item.type === 'CITY' && item.name === 'Kyiv'));
    assert.ok(entities.some(item => item.type === 'PERSON'));
    assert.ok(entities.some(item => item.type === 'ORGANISATION'));
    assert.ok(entities.some(item => item.type === 'COMMODITY'));
});
test('entity resolver merges aliases and respects identifier conflicts', () => {
    const resolver = new EntityResolver({ threshold: 0.65 });
    const first = resolver.add({ type: 'ORGANISATION', name: 'Financial Times', aliases: ['FT'], identifiers: { domain: 'ft.com' } });
    const merged = resolver.add({ type: 'ORGANISATION', name: 'FT', identifiers: { domain: 'ft.com' } });
    assert.equal(first.merged, false);
    assert.equal(merged.merged, true);
    const conflict = resolver.resolve(createEntity({ type: 'ORGANISATION', name: 'FT', identifiers: { domain: 'fake.example' } }));
    assert.equal(conflict.match, null);
    assert.equal(conflict.conflict, true);
});
test('entity merging preserves aliases, identifiers and evidence references', () => {
    const entity = mergeEntities(createEntity({ type: 'ASSET', name: 'Bitcoin', aliases: ['BTC'], identifiers: { ticker: 'BTC' }, evidence: ['r1'], confidence: 60 }), createEntity({ type: 'ASSET', name: 'BTC', aliases: ['Bitcoin'], identifiers: { ticker: 'BTC' }, evidence: ['r2'], confidence: 70 }));
    assert.deepEqual(new Set(entity.evidence), new Set(['r1', 'r2']));
    assert.ok(entity.aliases.includes('Bitcoin'));
    assert.equal(entity.identifiers.ticker, 'BTC');
});
test('entity graph supports neighbors, paths and connected components', () => {
    const graph = new EntityGraph();
    for (const id of ['a', 'b', 'c', 'd'])
        graph.addNode({ id });
    graph.connect('a', 'b').connect('b', 'c');
    assert.equal(graph.neighbors('b').length, 2);
    assert.deepEqual(graph.shortestPath('a', 'c'), ['a', 'b', 'c']);
    assert.equal(graph.connectedComponents().length, 2);
});
