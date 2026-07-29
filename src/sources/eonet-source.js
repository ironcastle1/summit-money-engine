import { BaseSource } from './base-source.js';
import { createEvent } from '../domain/events/event-schema.js';
import { normalizeCategory } from '../domain/events/categories.js';

const FEED_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=all&days=30&limit=1000';

function severity(category, geometryCount, closed) {
  const base = {
    volcano: 3.5,
    storm: 3.3,
    wildfire: 2.8,
    flood: 2.6,
    landslide: 2.5,
    drought: 2.1,
    ice: 1.5
  }[category] || 1.8;
  const persistence = Math.min(0.8, Math.log2(Math.max(1, geometryCount)) * 0.15);
  return Math.max(0.5, Math.min(5, base + persistence - (closed ? 0.25 : 0)));
}

export class EonetSource extends BaseSource {
  constructor(options) {
    super({ id: 'eonet', name: 'NASA EONET', weight: 0.9, ...options });
  }

  async fetchEvents() {
    const payload = await this.http.json(FEED_URL, { upstream: this.id, attempts: 1, timeoutMs: 8_000 });
    return (payload.events || []).flatMap(record => {
      const geometry = [...(record.geometry || [])].reverse().find(item => item.type === 'Point' && Array.isArray(item.coordinates));
      if (!geometry) return [];
      const category = normalizeCategory(record.categories?.[0]?.id || record.categories?.[0]?.title);
      const event = createEvent({
        source: 'NASA EONET',
        sourceId: record.id,
        title: record.title,
        category,
        lon: geometry.coordinates[0],
        lat: geometry.coordinates[1],
        time: geometry.date || record.closed || record.created,
        updatedAt: geometry.date || record.closed || record.created,
        severity: severity(category, record.geometry?.length || 1, Boolean(record.closed)),
        url: record.sources?.[0]?.url,
        attributes: {
          closed: Boolean(record.closed),
          geometryCount: record.geometry?.length || 0,
          sourceUrls: (record.sources || []).map(source => source.url).filter(Boolean).slice(0, 8)
        }
      });
      return event ? [event] : [];
    });
  }
}
