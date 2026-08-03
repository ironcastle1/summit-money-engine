import { BaseSource } from './base-source.js';
import { createEvent } from '../domain/events/event-schema.js';

const FEED_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';

export class UsgsSource extends BaseSource {
  constructor(options) {
    super({ id: 'usgs', name: 'USGS Earthquakes', weight: 1, ...options });
  }

  async fetchEvents() {
    const payload = await this.http.json(FEED_URL, { upstream: this.id, attempts: 1, timeoutMs: 8_000 });
    return (payload.features || []).flatMap(feature => {
      const coordinates = feature.geometry?.coordinates;
      const properties = feature.properties || {};
      if (!Array.isArray(coordinates)) return [];
      const magnitude = Number(properties.mag);
      const event = createEvent({
        source: 'USGS',
        sourceId: feature.id,
        title: properties.title,
        category: 'earthquake',
        lon: coordinates[0],
        lat: coordinates[1],
        time: properties.time,
        updatedAt: properties.updated,
        magnitude,
        severity: Number.isFinite(magnitude) ? Math.min(5, Math.max(0.5, magnitude)) : 1,
        alertLevel: properties.alert,
        url: properties.url,
        region: properties.place,
        attributes: {
          depthKm: Number.isFinite(Number(coordinates[2])) ? Number(coordinates[2]) : null,
          feltReports: Number.isFinite(Number(properties.felt)) ? Number(properties.felt) : null,
          tsunami: Number(properties.tsunami) === 1,
          significance: Number.isFinite(Number(properties.sig)) ? Number(properties.sig) : null,
          status: properties.status || null
        }
      });
      return event ? [event] : [];
    });
  }
}
