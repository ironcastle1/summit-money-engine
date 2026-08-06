import { buildRouteGraph } from './graph-builder.js';
import { normalizeRouteRequest } from './validation.js';
import { haversineKm } from './geo.js';
import { planAlternatives } from './alternative-router.js';
import { compareRoutes } from './route-comparison.js';
import { detectBottlenecks } from './bottleneck-detector.js';
import { simulateScenario } from './scenario-simulator.js';
import { buildLogisticsContext } from './snapshot-builder.js';
import { MemorySavedRouteRepository } from './saved-route-repository.js';
import { RouteWatchlist } from './route-watchlist.js';
import { evaluateRouteAlerts } from './alert-evaluator.js';
import { LogisticsExportService } from './export-service.js';
import { logisticsDiagnostics } from './diagnostics.js';
import { alternativesGeoJson, bottleneckGeoJson } from './map-features.js';
import { notFound, assertLogistics } from './errors.js';
import { vesselProfiles } from './vessel-profile.js';
import { cargoProfiles } from './cargo-profile.js';
import { routePolicies } from './route-policy.js';
import { routeSensitivity } from './route-sensitivity.js';
import { supplyChainExposure } from './supply-chain-exposure.js';
import { networkRedundancy } from './network-redundancy.js';
import { findAlternativePorts } from './port-alternative-finder.js';
import { canalProfiles } from './canal-transit-model.js';
import { customsChannels } from './customs-delay-model.js';
import { baseFreightRates } from './freight-rate-model.js';

export class LogisticsPlatform {
  constructor(options) {
    this.catalog = options.catalog;
    this.shipping = options.shipping;
    this.events = options.events;
    this.graph = options.graph || buildRouteGraph(this.catalog);
    this.repository = options.repository || new MemorySavedRouteRepository();
    this.watchlist = new RouteWatchlist(this.repository);
    this.exporter = new LogisticsExportService();
    this.contextTtlMs = options.contextTtlMs || 30_000;
    this.contextCache = new Map();
  }

  nearestNode(point, kinds = ['PORT', 'CHOKEPOINT', 'WAYPOINT']) {
    const ranked = this.graph
      .snapshot()
      .nodes
      .filter(node => kinds.includes(node.kind))
      .map(node => ({
        node,
        distanceKm: haversineKm(point, node.coordinates)
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return ranked[0] || null;
  }

  resolveRequest(input) {
    const request = normalizeRouteRequest(input);
    let originId = request.originId;
    let destinationId = request.destinationId;

    if (!originId && request.origin) {
      originId = this.nearestNode(request.origin)?.node.id;
    }
    if (!destinationId && request.destination) {
      destinationId = this.nearestNode(request.destination)?.node.id;
    }

    assertLogistics(
      originId && destinationId,
      'ROUTE_ENDPOINT_REQUIRED',
      'Origin and destination are required'
    );

    if (!this.graph.node(originId)) {
      throw notFound('origin', originId);
    }
    if (!this.graph.node(destinationId)) {
      throw notFound('destination', destinationId);
    }

    assertLogistics(
      originId !== destinationId,
      'SAME_ENDPOINT',
      'Origin and destination must differ'
    );

    return Object.freeze({
      ...request,
      originId,
      destinationId
    });
  }

  async liveContext(options = {}) {
    const cacheKey = options.includeLive === true ? 'LIVE' : 'CATALOGUE';
    const cached = this.contextCache.get(cacheKey);

    if (!options.force && cached && Date.now() - cached.cachedAt < this.contextTtlMs) {
      return cached.value;
    }

    const value = await buildLogisticsContext(
      {
        shipping: this.shipping,
        events: this.events
      },
      options
    );

    this.contextCache.set(cacheKey, {
      cachedAt: Date.now(),
      value
    });

    return value;
  }

  context(overrides = {}) {
    const cached = this.contextCache.get('LIVE')?.value || this.contextCache.get('CATALOGUE')?.value || {};
    return Object.freeze({
      ...cached,
      ...overrides
    });
  }

  async plan(input, options = {}) {
    const request = this.resolveRequest(input);
    const live = await this.liveContext(options);
    const baseRoutes = planAlternatives(this.graph, request, {
      ...live,
      ...options
    });
    const routes = baseRoutes.map(route => Object.freeze({
      ...route,
      sensitivity: routeSensitivity(route, options.sensitivity || {})
    }));
    const comparison = compareRoutes(routes);

    return Object.freeze({
      request,
      routes: Object.freeze(routes),
      comparison,
      supplyChainExposure: supplyChainExposure(routes, options.supplyChain || {}),
      redundancy: networkRedundancy(this.graph, request.originId, request.destinationId, request),
      geojson: alternativesGeoJson(routes),
      sourceStatus: live.sourceStatus,
      generatedAt: new Date().toISOString()
    });
  }

  async scenario(input) {
    const request = this.resolveRequest(input.request || input);
    await this.liveContext(input.context || {});
    return simulateScenario(this, {
      ...input,
      request
    });
  }

  network() {
    const snapshot = this.graph.snapshot();
    return Object.freeze({
      ...snapshot,
      vesselProfiles: vesselProfiles(),
      cargoProfiles: cargoProfiles(),
      policies: routePolicies(),
      canalProfiles: canalProfiles(),
      customsChannels: customsChannels(),
      baseFreightRates: baseFreightRates(),
      generatedAt: new Date().toISOString()
    });
  }

  bottlenecks(options = {}) {
    const result = detectBottlenecks(this.graph, {
      ...this.context(),
      ...options
    });

    return Object.freeze({
      ...result,
      geojson: bottleneckGeoJson(result.bottlenecks, this.graph)
    });
  }

  alternatePorts(portId, options = {}) {
    const port = this.catalog.port?.(portId) || this.catalog.ports?.find(item => item.id === portId);
    if (!port) {
      throw notFound('port', portId);
    }

    const riskById = this.context().nodeRiskById || new Map();
    return Object.freeze({
      port,
      alternatives: Object.freeze(findAlternativePorts(port, this.catalog.ports || [], {
        ...options,
        riskById
      })),
      generatedAt: new Date().toISOString()
    });
  }

  redundancy(originId, destinationId, options = {}) {
    return networkRedundancy(this.graph, originId, destinationId, options);
  }

  async save(ownerId, result, metadata = {}) {
    const recommended = result.routes?.find(route => route.recommended) || result.routes?.[0];
    assertLogistics(recommended, 'NO_ROUTE', 'No route is available to save');

    return this.repository.saveRoute(ownerId, Object.freeze({
      id: metadata.id || `route-${Date.now()}`,
      name: metadata.name || `${result.request.originId} to ${result.request.destinationId}`,
      request: result.request,
      recommended,
      comparison: result.comparison,
      createdAt: new Date().toISOString()
    }));
  }

  async saved(ownerId) {
    return this.repository.listRoutes(ownerId);
  }

  async removeSaved(ownerId, id) {
    return this.repository.removeRoute(ownerId, id);
  }

  async evaluateAlerts(ownerId, snapshots) {
    return evaluateRouteAlerts(
      await this.watchlist.list(ownerId),
      snapshots
    );
  }

  diagnostics() {
    return logisticsDiagnostics(this);
  }
}
