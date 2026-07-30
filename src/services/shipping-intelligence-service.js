import { scoreEventEvidence, scoreNewsEvidence, combineDisruptionRisk, aggregateNetworkRisk } from '../domain/shipping/disruption.js';
import { portActivityScore, calculateCongestion } from '../domain/shipping/operational.js';
import { analyseRoute } from '../domain/shipping/route-analysis.js';
import { analyseShippingImpactAtPoint } from '../domain/shipping/impact.js';
import { round } from '../core/numbers.js';

function publicActivity(result) {
  if (!result) return null;
  const value = result.value || result;
  return { ...value, records: undefined, source: result.source || null, cache: result.cache || null, stale: result.stale || false };
}
function activityError(error) { return { error: { code: error.code || error.name || 'ACTIVITY_ERROR', message: error.message } }; }

export class ShippingIntelligenceService {
  constructor(options) {
    this.catalog = options.catalog;
    this.events = options.events;
    this.news = options.news;
    this.sources = options.sources;
    this.cache = options.cache;
  }

  async context(options = {}) {
    const hours = Math.max(6, Math.min(168, Number(options.hours || 48)));
    const [eventSnapshot, newsSnapshot] = await Promise.all([
      this.events.globalSnapshot({ since: Date.now() - Math.max(30, Math.ceil(hours / 24)) * 86_400_000, limit: 5000, maxAgeMs: 20_000 }),
      this.news.search({ query: options.query || 'shipping port vessel freight canal strait cargo', sourceQuery: options.sourceQuery || 'shipping OR port OR vessel OR freight OR canal OR strait', hours, limit: 160, sourceLimit: 180, correlationHours: 48, includeEventLinks: false, sort: 'latest' }).catch(() => ({ stories: [], articles: [], sources: {} }))
    ]);
    return { hours, events: eventSnapshot.events || [], stories: newsSnapshot.stories || [], eventSources: eventSnapshot.sources || {}, newsSources: newsSnapshot.sources || {} };
  }

  nodeAnalysis(node, context, operational = null) {
    const event = scoreEventEvidence(node, context.events, { radiusKm: node.radiusKm || (node.type === 'energy' ? 220 : 150) });
    const news = scoreNewsEvidence(node, context.stories);
    const operationalScore = portActivityScore(operational?.value || operational);
    const risk = combineDisruptionRisk({ event, news, operational: operationalScore, importance: node.importance });
    return { ...node, risk, signals: { event, news, operational: operationalScore }, congestion: calculateCongestion(operational?.value || operational) };
  }

  async snapshot(options = {}) {
    const key = `shipping:snapshot:${options.hours || 48}:${options.query || ''}`;
    const cached = await this.cache.getOrLoad(key, { ttlMs: 120_000, staleMs: 900_000 }, async () => {
      const context = await this.context(options);
      const ports = this.catalog.ports.map(port => this.nodeAnalysis(port, context));
      const chokepoints = this.catalog.chokepoints.map(item => this.nodeAnalysis(item, context));
      const nodeRiskById = new Map([...ports, ...chokepoints].map(item => [item.id, item.risk]));
      const routes = this.catalog.routes.features.map(route => analyseRoute(route, { ...context, ports: this.catalog.ports, chokepoints: this.catalog.chokepoints, nodeRiskById }));
      const commodities = this.catalog.commodities.map(commodity => this.commodityNetworkRisk(commodity, routes, chokepoints));
      return {
        generatedAt: new Date().toISOString(), hours: context.hours,
        summary: { ports: aggregateNetworkRisk(ports), chokepoints: aggregateNetworkRisk(chokepoints), routes: aggregateNetworkRisk(routes), sources: this.sources.health() },
        ports: ports.sort((a, b) => b.risk.score - a.risk.score || b.importance - a.importance),
        chokepoints: chokepoints.sort((a, b) => b.risk.score - a.risk.score || b.importance - a.importance),
        routes: routes.sort((a, b) => b.risk.score - a.risk.score || b.importance - a.importance),
        commodities: commodities.sort((a, b) => (b.supplyRisk ?? -1) - (a.supplyRisk ?? -1)),
        sourceStatus: { shipping: this.sources.health(), events: context.eventSources, news: context.newsSources }
      };
    });
    const payload = cached.value;
    return { ...payload, cache: cached.cache, stale: cached.cache === 'STALE' };
  }

  commodityNetworkRisk(commodity, routes, chokepoints) {
    const routeRisks = routes.filter(route => commodity.routeIds.includes(route.id)).map(route => route.risk.score).filter(Number.isFinite);
    const chokeRisks = chokepoints.filter(item => commodity.chokepointIds.includes(item.id)).map(item => item.risk.score).filter(Number.isFinite);
    const values = [...routeRisks, ...chokeRisks];
    return {
      ...commodity, supplyRisk: values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length, 1) : null,
      routeCount: routeRisks.length, chokepointCount: chokeRisks.length, evidenceCount: values.length
    };
  }

  async portDetail(id, options = {}) {
    const port = this.catalog.port(id);
    if (!port) throw Object.assign(new Error('Port not found'), { code: 'PORT_NOT_FOUND' });
    const context = await this.context({ ...options, query: port.name, sourceQuery: `"${port.name}" OR "${port.unlocode}" port shipping` });
    let activity = null;
    const source = port.noaaStation ? this.sources.get('noaa-coops') : this.sources.get('imf-portwatch');
    if (source) {
      try { activity = port.noaaStation && source.portConditions ? await source.portConditions(port) : await source.portActivity(port); }
      catch (error) { activity = activityError(error); }
    }
    const analysis = this.nodeAnalysis(port, context, activity?.value ? activity : null);
    return { ...analysis, activity: activity?.error ? activity : publicActivity(activity), connectedRoutes: port.routeIds.map(id => this.catalog.route(id)).filter(Boolean).map(feature => feature.properties), sourceStatus: this.sources.health(), generatedAt: new Date().toISOString() };
  }

  async chokepointDetail(id, options = {}) {
    const chokepoint = this.catalog.chokepoint(id);
    if (!chokepoint) throw Object.assign(new Error('Chokepoint not found'), { code: 'CHOKEPOINT_NOT_FOUND' });
    const context = await this.context({ ...options, query: chokepoint.name, sourceQuery: `"${chokepoint.name}" shipping vessel disruption` });
    const analysis = this.nodeAnalysis(chokepoint, context);
    return { ...analysis, connectedRoutes: chokepoint.routeIds.map(routeId => this.catalog.route(routeId)).filter(Boolean).map(feature => feature.properties), alternatives: chokepoint.alternateRouteIds, generatedAt: new Date().toISOString() };
  }

  async routeDetail(id, options = {}) {
    const feature = this.catalog.route(id);
    if (!feature) throw Object.assign(new Error('Route not found'), { code: 'ROUTE_NOT_FOUND' });
    const context = await this.context({ ...options, query: feature.properties.name, sourceQuery: `"${feature.properties.name}" shipping freight` });
    const ports = this.catalog.ports.map(port => this.nodeAnalysis(port, context));
    const chokepoints = this.catalog.chokepoints.map(item => this.nodeAnalysis(item, context));
    const nodeRiskById = new Map([...ports, ...chokepoints].map(item => [item.id, item.risk]));
    return { ...analyseRoute(feature, { ...context, ports: this.catalog.ports, chokepoints: this.catalog.chokepoints, nodeRiskById }), geometry: feature.geometry, ports: ports.filter(port => port.routeIds.includes(id)), chokepoints: chokepoints.filter(item => item.routeIds.includes(id)), generatedAt: new Date().toISOString() };
  }

  async impactAtPoint(point, radiusKm, options = {}) {
    const snapshot = await this.snapshot(options);
    const riskById = new Map([...snapshot.ports, ...snapshot.chokepoints].map(item => [item.id, item.risk]));
    return analyseShippingImpactAtPoint({ point, radiusKm, ports: this.catalog.ports, chokepoints: this.catalog.chokepoints, routes: this.catalog.routes, riskById });
  }
}
