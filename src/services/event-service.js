import { analyzeRadius } from '../domain/scoring/radius-analysis.js';
import { toTimestamp } from '../core/time.js';

export class EventService {
  constructor(options) {
    this.registry = options.registry;
  }

  async globalSnapshot(options = {}) {
    const snapshot = await this.registry.snapshot({ force: options.force, maxAgeMs: options.maxAgeMs });
    const categories = new Set(options.categories || []);
    const since = Number.isFinite(options.since) ? options.since : null;
    const limit = Math.min(5000, Math.max(1, options.limit || 2000));
    const events = snapshot.events
      .filter(event => !categories.size || categories.has(event.category))
      .filter(event => since === null || toTimestamp(event.time) >= since)
      .slice(0, limit);
    return {
      ...snapshot,
      events,
      filteredCount: events.length
    };
  }

  async scanRadius(options) {
    const snapshot = await this.registry.snapshot({ maxAgeMs: 20_000 });
    const analysis = analyzeRadius({
      events: snapshot.events,
      sources: snapshot.sources,
      lat: options.lat,
      lon: options.lon,
      radiusKm: options.radiusKm,
      lookbackDays: options.lookbackDays,
      now: options.now
    });
    return {
      point: { lat: options.lat, lon: options.lon, radiusKm: options.radiusKm },
      metrics: analysis.metrics,
      events: analysis.events.slice(0, options.eventLimit || 250),
      sourceStatus: snapshot.sources,
      generatedAt: snapshot.generatedAt,
      snapshotAgeMs: Date.now() - snapshot.generatedAtMs
    };
  }
}
