import test from 'node:test';
import assert from 'node:assert/strict';
import { EventLifecycleTracker } from '../../src/intelligence-processing/event-lifecycle.js';
import { EventStateMachine } from '../../src/intelligence-processing/event-state-machine.js';
import { EntityGraph } from '../../src/intelligence-processing/entity-graph.js';
import { degreeCentrality, betweennessCentrality, communityLabels, graphSummary } from '../../src/intelligence-processing/graph-analytics.js';
test('lifecycle tracker records revisions and deltas', () => {
    const tracker = new EventLifecycleTracker();
    tracker.observe({ id: 'e1', status: 'REPORTED', confidence: { score: 50 }, materiality: { score: 40 }, sourceIds: ['a'] });
    tracker.observe({ id: 'e1', status: 'CONFIRMED', confidence: { score: 80 }, materiality: { score: 70 }, sourceIds: ['a', 'b'] });
    const change = tracker.change('e1');
    assert.equal(change.statusChanged, true);
    assert.equal(change.confidenceDelta, 30);
    assert.equal(change.sourceCountDelta, 1);
});
test('event state machine permits valid transitions and rejects invalid jumps', () => {
    const machine = new EventStateMachine('REPORTED');
    machine.transition('CONFIRMED', { reason: 'two sources' });
    machine.transition('ONGOING');
    assert.equal(machine.state, 'ONGOING');
    assert.throws(() => machine.transition('RUMOURED'), /Invalid event transition/);
});
test('graph analytics identify hubs and bridge nodes', () => {
    const graph = new EntityGraph();
    for (const id of ['a', 'b', 'c', 'd', 'e'])
        graph.addNode({ id });
    graph.connect('a', 'b').connect('b', 'c').connect('b', 'd').connect('d', 'e');
    assert.equal(degreeCentrality(graph)[0].id, 'b');
    assert.equal(betweennessCentrality(graph)[0].id, 'b');
    assert.equal(graphSummary(graph).nodes, 5);
});
test('community labels partition disconnected entity groups', () => {
    const graph = new EntityGraph();
    for (const id of ['a', 'b', 'c', 'd'])
        graph.addNode({ id });
    graph.connect('a', 'b').connect('c', 'd');
    const communities = communityLabels(graph);
    assert.equal(communities.length, 2);
    assert.ok(communities.every(item => item.size === 2));
});
