import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePort, normalizeChokepoint, normalizeCommodity } from '../../src/domain/shipping/schema.js';
import { pointToSegmentKm, pointToLineKm, routeLengthKm, corridorEvents, nearestNetworkNode } from '../../src/domain/shipping/network.js';
import { scoreEventEvidence, scoreNewsEvidence, combineDisruptionRisk, aggregateNetworkRisk } from '../../src/domain/shipping/disruption.js';
import { portActivityScore, calculateCongestion, robustZScore } from '../../src/domain/shipping/operational.js';
import { aggregateTrade, tradeConcentration, exposureScore, normalizeTradeRecords } from '../../src/domain/shipping/trade.js';
import { analyseRoute } from '../../src/domain/shipping/route-analysis.js';
import { analyseShippingImpactAtPoint } from '../../src/domain/shipping/impact.js';

const now = Date.now();
const port = normalizePort({ id: 'test-port', unlocode: 'GBXXX', name: 'Test Port', country: 'United Kingdom', countryCode: 'GB', region: 'Europe', coordinates: { lat: 51, lon: 0 }, importance: 90, type: 'gateway', commodities: ['containers'], routeIds: ['route-a'] });
const choke = normalizeChokepoint({ id: 'test-strait', name: 'Test Strait', coordinates: { lat: 50, lon: 1 }, radiusKm: 100, importance: 95, routeIds: ['route-a'], commodities: ['containers'] });
const commodity = normalizeCommodity({ id: 'containers', name: 'Containers', routeIds: ['route-a'], chokepointIds: ['test-strait'], keywords: ['freight'] });
const route = { type: 'Feature', properties: { id: 'route-a', name: 'Route A', importance: 90, class: 'shipping', commodity: 'containers' }, geometry: { type: 'LineString', coordinates: [[-2, 50], [0, 51], [2, 50]] } };

function event(overrides = {}) {
  return { id: 'e1', title: 'Port closure after storm', category: 'storm', lat: 51.05, lon: 0.05, severity: 4, time: new Date(now - 3_600_000).toISOString(), ...overrides };
}

test('shipping schemas normalize identifiers, coordinates, and arrays', () => {
  assert.equal(port.id, 'test-port'); assert.equal(port.countryCode, 'GB'); assert.deepEqual(port.commodities, ['containers']);
  assert.equal(choke.radiusKm, 100); assert.equal(commodity.id, 'containers');
});

test('shipping schema rejects invalid coordinates', () => {
  assert.throws(() => normalizePort({ id: 'bad', coordinates: { lat: 999, lon: 0 } }), error => error.code === 'INVALID_PORT');
});

test('point-to-line distance and route length are geographic', () => {
  assert.ok(pointToSegmentKm({ lat: 51, lon: 0 }, { lat: 50, lon: -2 }, { lat: 50, lon: 2 }) > 100);
  assert.ok(pointToLineKm({ lat: 51, lon: 0 }, route.geometry.coordinates) < 2);
  assert.ok(routeLengthKm(route) > 300);
});

test('corridor events include nearby records and reject remote records', () => {
  const result = corridorEvents(route, [event(), event({ id: 'remote', lat: -20, lon: 100 })], 100);
  assert.equal(result.length, 1); assert.equal(result[0].event.id, 'e1');
});

test('nearest network node compares ports and chokepoints', () => {
  const nearest = nearestNetworkNode({ lat: 51.01, lon: 0.01 }, [port], [choke]);
  assert.equal(nearest.id, port.id); assert.equal(nearest.kind, 'PORT');
});

test('event evidence is location-specific and normalizes five-point severity', () => {
  const local = scoreEventEvidence(port, [event()], { now, radiusKm: 150 });
  const remotePort = { ...port, coordinates: { lat: -20, lon: 100 } };
  const remote = scoreEventEvidence(remotePort, [event()], { now, radiusKm: 150 });
  assert.ok(local.score > 0); assert.equal(local.count, 1); assert.equal(local.evidence[0].severity, 80); assert.equal(remote.score, 0);
});

test('news evidence requires an entity or commodity mention', () => {
  const stories = [{ id: 's1', title: 'Test Port container terminal closed', latestAt: new Date(now - 60_000).toISOString(), verificationScore: 80, velocity: { index: 70 } }, { id: 's2', title: 'Unrelated election', latestAt: new Date(now - 60_000).toISOString(), verificationScore: 90 }];
  const scored = scoreNewsEvidence(port, stories, { now });
  assert.equal(scored.count, 1); assert.ok(scored.score > 0);
});

test('combined disruption risk exposes evidence and fails confidence closed', () => {
  const empty = combineDisruptionRisk({ event: { score: 0, count: 0 }, news: { score: 0, count: 0 }, operational: { score: null, sampleSize: 0 }, importance: 90 });
  assert.equal(empty.score, 0); assert.equal(empty.confidence, null);
  const supported = combineDisruptionRisk({ event: { score: 70, count: 4 }, news: { score: 60, count: 3 }, operational: { score: 40, sampleSize: 12 }, importance: 90 });
  assert.ok(supported.score > 40); assert.ok(supported.confidence > 50); assert.equal(supported.sourceCoverage, 3);
});

test('network aggregation uses importance weighting and counts bands', () => {
  const summary = aggregateNetworkRisk([{ importance: 100, risk: { score: 90 } }, { importance: 50, risk: { score: 30 } }]);
  assert.ok(summary.weighted > summary.mean); assert.equal(summary.criticalCount, 1); assert.equal(summary.highCount, 1);
});

test('operational scores remain unavailable without measurements', () => {
  assert.equal(portActivityScore({}).score, null); assert.equal(calculateCongestion({}).index, null);
  const score = portActivityScore({ callsChangePct: -20, waitingTimeChangePct: 30, sampleSize: 20 });
  assert.ok(score.score > 0); assert.equal(score.sampleSize, 20);
});

test('congestion and z-score quantify operational deviation', () => {
  const congestion = calculateCongestion({ waitingVessels: 25, medianWaitHours: 36, sampleSize: 20 });
  assert.equal(congestion.index, 50); assert.ok(congestion.confidence > 50);
  assert.ok(robustZScore(20, [1,2,3,4,5,6,7,8,9,10]) > 2);
});

test('trade normalization, aggregation, and concentration preserve values', () => {
  const records = normalizeTradeRecords([{ period: '2025', partnerDesc: 'A', cmdDesc: 'Oil', primaryValue: 80 }, { period: '2025', partnerDesc: 'B', cmdDesc: 'Oil', primaryValue: 20 }]);
  const grouped = aggregateTrade(records, 'partner'); const concentration = tradeConcentration(records, 'partner');
  assert.equal(grouped[0].sharePct, 80); assert.equal(concentration.top1Pct, 80); assert.ok(concentration.hhi > 6000);
});

test('exposure score rewards route risk and reduces for alternatives', () => {
  const noAlternative = exposureScore({ routeRisk: 80, concentrationPct: 80, dependencyPct: 70, alternativeCount: 0 });
  const alternatives = exposureScore({ routeRisk: 80, concentrationPct: 80, dependencyPct: 70, alternativeCount: 3 });
  assert.ok(noAlternative > alternatives);
});

test('route analysis fuses corridor events and connected node risk', () => {
  const result = analyseRoute(route, { events: [event()], stories: [], ports: [port], chokepoints: [choke], nodeRiskById: new Map([[port.id,{score:70}],[choke.id,{score:60}]]) });
  assert.equal(result.eventCount, 1); assert.equal(result.portCount, 1); assert.equal(result.chokepointCount, 1); assert.ok(result.risk.score > 0);
});

test('point impact returns only nearby shipping infrastructure', () => {
  const result = analyseShippingImpactAtPoint({ point: { lat: 51, lon: 0 }, radiusKm: 150, ports: [port], chokepoints: [choke], routes: { features: [route] }, riskById: new Map([[port.id,{score:70}],[choke.id,{score:40}]]) });
  assert.equal(result.nearbyPorts.length, 1); assert.equal(result.nearbyChokepoints.length, 1); assert.ok(result.score > 0);
});
