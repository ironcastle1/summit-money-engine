import {
  buildConflictSnapshot,
  compareTheatres,
  ConflictExportService,
  ConflictWatchlist,
  conflictCatalog,
  conflictDiagnostics,
  evaluateConflictAlerts,
  runConflictScenario
}
from '../conflict-intelligence/index.js';
import {
  normalizedConflictRequest,
  normalizedConflictScenario
}
from '../conflict-intelligence/validation.js';
export class ConflictIntelligencePlatformService {
  constructor(options = {
  }) {
    this.eventService = options.eventService;
    this.countryCatalog = options.countryCatalog;
    this.shippingCatalog = options.shippingCatalog;
    this.watchlist = options.watchlist || new ConflictWatchlist();
    this.exporter = options.exporter || new ConflictExportService();
    this.snapshotCache = new Map();
    this.cacheTtlMs = Math.max(5000,
    Number(options.cacheTtlMs) || 45000);
  }
  catalog() {
    return Object.freeze({
      ...conflictCatalog(),
      countries: this.countryCatalog?.listCountries?.({
        limit: 500
      }) || [],
      ports: this.shippingCatalog?.listPorts?.({
        limit: 500
      }) || []
    });
  }
  diagnostics() {
    return conflictDiagnostics(this);
  }
  key(request) {
    return JSON.stringify(request);
  }
  cached(request) {
    const item = this.snapshotCache.get(this.key(request));
    return item && Date.now() - item.createdAt < this.cacheTtlMs ? item.value : null;
  }
  remember(request,
  value) {
    this.snapshotCache.set(this.key(request),
    {
      createdAt: Date.now(),
      value
    });
    if (this.snapshotCache.size > 20)
    this.snapshotCache.delete(this.snapshotCache.keys().next().value);
    return value;
  }
  async sourceEvents(request) {
    if (!this.eventService)
    return [];
    const since = Date.now() - request.hours * 3600000;
    const snapshot = await this.eventService.globalSnapshot({
      categories: ['conflict',
      'terror',
      'protest',
      'infrastructure',
      'transport',
      'energy'],
      since,
      limit: 5000,
      force: request.force
    });
    return snapshot.events || [];
  }
  async snapshot(input = {
  }) {
    const request = normalizedConflictRequest(input);
    if (!request.force && !input.events) {
      const cached = this.cached(request);
      if (cached)
      return Object.freeze({
        ...cached,
        cache: 'HIT'
      });
    }
    const events = input.events || await this.sourceEvents(request),
    result = buildConflictSnapshot(events,
    {
      ...request,
      now: input.now
    });
    const enriched = Object.freeze({
      ...result,
      sourceStatus: input.sourceStatus || this.eventService?.registry?.health?.() || {
      },
      cache: 'MISS'
    });
    return input.events ? enriched : this.remember(request,
    enriched);
  }
  async theatre(id,
  input = {
  }) {
    const snapshot = input.snapshot || await this.snapshot({
      ...input,
      limit: 250
    });
    const theatre = snapshot.theatres.find(item => item.id === id);
    if (!theatre)
    throw Object.assign(new Error('Conflict theatre not found'),
    {
      code: 'NOT_FOUND',
      statusCode: 404
    });
    return theatre;
  }
  async compare(input = {
  }) {
    const snapshot = input.snapshot || await this.snapshot({
      ...input,
      limit: 250
    });
    const ids = input.theatreIds || input.ids || [];
    const theatres = ids.length ? snapshot.theatres.filter(item => ids.includes(item.id)) : snapshot.theatres;
    return compareTheatres(theatres);
  }
  async scenario(input = {
  }) {
    const request = normalizedConflictScenario(input),
    theatre = input.theatre || await this.theatre(request.theatreId,
    input);
    return runConflictScenario(theatre,
    request);
  }
  async alerts(owner,
  input = {
  }) {
    const watches = await this.watchlist.list(owner),
    snapshot = input.snapshot || await this.snapshot({
      ...input,
      limit: 250
    });
    return evaluateConflictAlerts(watches,
    snapshot.theatres);
  }
}
export function createConflictIntelligencePlatformService(options) {
  return new ConflictIntelligencePlatformService(options);
}
