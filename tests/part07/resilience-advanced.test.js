import test from 'node:test';
import assert from 'node:assert/strict';
import { RouteGraph } from '../../src/logistics/route-graph.js';
import { networkRedundancy } from '../../src/logistics/network-redundancy.js';
import { findAlternativePorts } from '../../src/logistics/port-alternative-finder.js';
import { routeSensitivity } from '../../src/logistics/route-sensitivity.js';
import { supplyChainExposure } from '../../src/logistics/supply-chain-exposure.js';

function graph() {
  const routeGraph = new RouteGraph();
  for (const [id, lon] of [['a', 0], ['b', 5], ['c', 5], ['d', 10]]) {
    routeGraph.addNode({ id, name: id, kind: 'PORT', coordinates: { lat: 0, lon }, importance: 70 });
  }
  for (const edge of [
    { id: 'ab', from: 'a', to: 'b', distanceKm: 500 },
    { id: 'bd', from: 'b', to: 'd', distanceKm: 500 },
    { id: 'ac', from: 'a', to: 'c', distanceKm: 650 },
    { id: 'cd', from: 'c', to: 'd', distanceKm: 650 }
  ]) {
    routeGraph.addEdge(edge);
  }
  return routeGraph;
}

test('network redundancy detects viable detours and critical edges', () => {
  const result = networkRedundancy(graph(), 'a', 'd');
  assert.equal(result.connected, true);
  assert.ok(result.alternativeCount >= 2);
  assert.equal(result.criticalEdges.length, 0);
  assert.ok(result.score > 0);
});

test('port alternatives rank commodity-compatible lower-risk substitutes', () => {
  const source = {
    id: 'source',
    name: 'Source',
    country: 'A',
    countryCode: 'AA',
    coordinates: { lat: 0, lon: 0 },
    commodities: ['containers', 'vehicles'],
    importance: 90
  };
  const candidates = [
    source,
    {
      id: 'near',
      name: 'Near',
      country: 'B',
      countryCode: 'BB',
      coordinates: { lat: 0, lon: 5 },
      commodities: ['containers', 'vehicles'],
      importance: 85
    },
    {
      id: 'far',
      name: 'Far',
      country: 'C',
      countryCode: 'CC',
      coordinates: { lat: 0, lon: 15 },
      commodities: ['bulk'],
      importance: 60
    }
  ];
  const riskById = new Map([
    ['source', { score: 80 }],
    ['near', { score: 30 }],
    ['far', { score: 20 }]
  ]);
  const alternatives = findAlternativePorts(source, candidates, { riskById, maximumDistanceKm: 2000 });
  assert.equal(alternatives[0].id, 'near');
  assert.ok(alternatives[0].riskImprovement > 0);
});

test('route sensitivity and supply-chain exposure expose decision consequences', () => {
  const route = {
    id: 'r1',
    recommended: true,
    metrics: {
      eta: { durationHours: 240, durationDays: 10 },
      cost: {
        totalUsd: 1000000,
        bunkerCostUsd: 300000,
        carbonCostUsd: 50000,
        charterUsd: 240000
      },
      exposure: { risk: { score: 70 } },
      reliability: { score: 62 }
    }
  };
  const sensitivity = routeSensitivity(route);
  assert.equal(sensitivity.scenarios.length, 4);
  assert.ok(sensitivity.scenarios[0].costDeltaUsd > 0);

  const exposure = supplyChainExposure([route], {
    inventoryCoverDays: 3,
    criticalSupplierSharePct: 75,
    singleSourceSharePct: 80
  });
  assert.ok(exposure.score >= 60);
  assert.ok(exposure.actions.length >= 2);
});
