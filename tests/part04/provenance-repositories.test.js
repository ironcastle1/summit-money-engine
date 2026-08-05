import test from 'node:test';
import assert from 'node:assert/strict';
import { ProvenanceLedger } from '../../src/intelligence-processing/provenance-ledger.js';
import { BoundedRepository, ProcessingRepositories } from '../../src/intelligence-processing/repositories.js';
import { ProcessingMetrics } from '../../src/intelligence-processing/processing-metrics.js';
import { explainEvent } from '../../src/intelligence-processing/explainability.js';
test('provenance ledger stores evidence and reconstructs lineage', () => {
    const ledger = new ProvenanceLedger();
    ledger.append({ recordId: 'r1', outputId: 'c1', operation: 'CLUSTER', inputs: ['r1'] });
    ledger.append({ outputId: 'e1', operation: 'FUSE', inputs: ['c1'] });
    assert.equal(ledger.forRecord('r1').length, 1);
    assert.equal(ledger.lineage('e1').length, 2);
});
test('bounded repositories prune oldest items and support queries', () => {
    const repository = new BoundedRepository({ maximum: 2 });
    repository.set({ id: 'a', category: 'x' });
    repository.set({ id: 'b', category: 'x' });
    repository.set({ id: 'c', category: 'y' });
    assert.equal(repository.has('a'), false);
    assert.equal(repository.findBy('category', 'x').length, 1);
    assert.equal(repository.list().length, 2);
});
test('processing repositories, metrics and explainability expose operational snapshots', async () => {
    const repositories = new ProcessingRepositories({ events: 10 });
    repositories.events.set({ id: 'e1', visible: true });
    assert.equal(repositories.snapshot().events.size, 1);
    const metrics = new ProcessingMetrics();
    metrics.increment('records', 2);
    const stop = metrics.timer('run');
    await new Promise(resolve => setTimeout(resolve, 2));
    stop();
    assert.equal(metrics.snapshot().counters.records, 2);
    const explanation = explainEvent({ id: 'e1', confidence: { score: 80, label: 'HIGH', independentSourceCount: 2 }, materiality: { score: 70, level: 'MATERIAL', reasons: ['port closed'] } });
    assert.equal(explanation.eventId, 'e1');
    assert.ok(explanation.factors.length >= 2);
});
