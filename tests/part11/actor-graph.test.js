import test from 'node:test';
import assert from 'node:assert/strict';
import {
  conflictEvents
}
from '../../src/conflict-intelligence/conflict-event-normalizer.js';
import {
  buildActorGraph
}
from '../../src/conflict-intelligence/actor-graph.js';
import {
  rawEvents
}
from './fixtures.js';
test('actor graph aggregates participants and hostile links',
() => {
  const graph = buildActorGraph(conflictEvents(rawEvents));
  assert.ok(graph.nodes.some(node => node.name === 'Example Army'));
  assert.ok(graph.edges.length >= 1);
});
