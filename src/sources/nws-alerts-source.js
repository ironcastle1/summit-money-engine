import { BaseSource } from './base-source.js';
import { createEvent } from '../domain/events/event-schema.js';

const FEED_URL = 'https://api.weather.gov/alerts/active';

function centroid(geometry) {
  if (!geometry) return null;
  if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) return { lon: geometry.coordinates[0], lat: geometry.coordinates[1] };
  const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.type === 'MultiPolygon' ? geometry.coordinates.flat() : [];
  const points = rings.flat().filter(pair => Array.isArray(pair) && pair.length >= 2);
  if (!points.length) return null;
  const total = points.reduce((sum, pair) => ({ lon: sum.lon + Number(pair[0]), lat: sum.lat + Number(pair[1]) }), { lon: 0, lat: 0 });
  return { lon: total.lon / points.length, lat: total.lat / points.length };
}

function category(event, headline) {
  const text = `${event || ''} ${headline || ''}`.toLowerCase();
  if (/flood|flash flood|coastal flood/.test(text)) return 'flood';
  if (/fire|red flag/.test(text)) return 'wildfire';
  if (/hurricane|tropical|storm|tornado|thunder|wind|blizzard|snow|ice/.test(text)) return 'storm';
  if (/heat|cold|freeze/.test(text)) return 'health';
  return 'other';
}

function severity(value, urgency, certainty) {
  const text = `${value || ''} ${urgency || ''} ${certainty || ''}`.toLowerCase();
  if (/extreme|immediate|observed/.test(text)) return 5;
  if (/severe|expected/.test(text)) return 4;
  if (/moderate|likely/.test(text)) return 3;
  if (/minor|possible/.test(text)) return 2;
  return 1.5;
}

export class NwsAlertsSource extends BaseSource {
  constructor(options) { super({ id: 'nws-alerts', name: 'US National Weather Service', weight: 0.95, ...options }); this.userAgent = options.userAgent || 'Merlin/18.0'; }
  async fetchEvents() {
    const payload = await this.http.json(FEED_URL, {
      upstream: this.id,
      attempts: 2,
      timeoutMs: 12_000,
      headers: { accept: 'application/geo+json', 'user-agent': this.userAgent }
    });
    return (payload.features || []).flatMap(feature => {
      const props = feature.properties || {};
      const point = centroid(feature.geometry) || centroid(props.geometry);
      if (!point) return [];
      const event = createEvent({
        source: 'NWS', sourceId: feature.id || props.id, title: props.headline || props.event,
        category: category(props.event, props.headline), lat: point.lat, lon: point.lon,
        time: props.onset || props.sent || props.effective, updatedAt: props.updated || props.sent,
        severity: severity(props.severity, props.urgency, props.certainty), alertLevel: props.severity,
        region: props.areaDesc, url: props['@id'] || feature.id,
        geometryType: feature.geometry?.type || 'Point',
        attributes: { event: props.event || null, urgency: props.urgency || null, certainty: props.certainty || null, expires: props.expires || null, sender: props.senderName || null }
      });
      return event ? [event] : [];
    });
  }
}
