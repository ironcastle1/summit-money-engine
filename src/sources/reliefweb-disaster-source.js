import { BaseSource } from './base-source.js';
import { createEvent } from '../domain/events/event-schema.js';

function category(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('earthquake')) return 'earthquake';
  if (text.includes('flood')) return 'flood';
  if (text.includes('storm') || text.includes('cyclone') || text.includes('hurricane')) return 'storm';
  if (text.includes('wild fire') || text.includes('wildfire')) return 'wildfire';
  if (text.includes('drought')) return 'drought';
  if (text.includes('volcano')) return 'volcano';
  if (text.includes('epidemic')) return 'health';
  if (text.includes('conflict')) return 'conflict';
  return 'other';
}

export class ReliefWebDisasterSource extends BaseSource {
  constructor(options) {
    super({ id: 'reliefweb-disasters', name: 'UN OCHA ReliefWeb Disasters', weight: 0.95, ...options, configured: options.enabled !== false });
    this.baseUrl = options.baseUrl || 'https://api.reliefweb.int/v2';
    this.appName = options.appName || 'merlin';
  }
  async fetchEvents() {
    const url = new URL(`${this.baseUrl.replace(/\/$/, '')}/disasters`);
    url.searchParams.set('appname', this.appName);
    url.searchParams.set('profile', 'full');
    url.searchParams.set('limit', '250');
    url.searchParams.set('sort[]', 'date.created:desc');
    const payload = await this.http.json(url, { upstream: this.id, attempts: 2, timeoutMs: 15_000 });
    return (payload.data || []).flatMap(record => {
      const fields = record.fields || {};
      const location = fields.primary_country?.location || fields.country?.[0]?.location || {};
      const types = (fields.type || []).map(item => item.name || item).filter(Boolean);
      const event = createEvent({
        source: 'RELIEFWEB', sourceId: record.id, title: fields.name || `Disaster ${record.id}`,
        category: category(types[0]), lat: location.lat, lon: location.lon,
        time: fields.date?.created || fields.date?.event || fields.date?.changed,
        updatedAt: fields.date?.changed || fields.date?.created,
        severity: fields.status === 'ongoing' ? 3.2 : 2.2,
        alertLevel: fields.status || null,
        country: fields.primary_country?.name || fields.country?.[0]?.name || null,
        url: fields.url || fields.url_alias || null,
        attributes: { types, status: fields.status || null, glide: fields.glide || null }
      });
      return event ? [event] : [];
    });
  }
}
