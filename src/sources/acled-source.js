import { BaseSource } from './base-source.js';
import { createEvent } from '../domain/events/event-schema.js';

function category(eventType, subEventType) {
  const value = `${eventType || ''} ${subEventType || ''}`.toLowerCase();
  if (value.includes('protest')) return 'protest';
  if (value.includes('explosion') || value.includes('violence') || value.includes('battle')) return 'conflict';
  if (value.includes('strategic')) return 'infrastructure';
  return 'conflict';
}

function severity(record) {
  const fatalities = Number(record.fatalities || 0);
  const type = String(record.event_type || '').toLowerCase();
  const base = type.includes('battle') ? 3 : type.includes('explosion') ? 3.4 : type.includes('protest') ? 1.6 : 2.2;
  return Math.min(5, base + Math.log10(fatalities + 1) * 0.9);
}

export class AcledSource extends BaseSource {
  constructor(options) {
    const configured = Boolean(options.accessToken);
    super({ id: 'acled', name: 'ACLED', weight: 1.2, configured, ...options });
    this.accessToken = options.accessToken;
  }

  async fetchEvents() {
    const today = new Date();
    const start = new Date(today.getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
    const end = today.toISOString().slice(0, 10);
    const query = new URLSearchParams({
      event_date: `${start}|${end}`,
      event_date_where: 'BETWEEN',
      limit: '5000'
    });
    const payload = await this.http.json(`https://acleddata.com/api/acled/read?${query}`, {
      upstream: this.id,
      attempts: 1,
      timeoutMs: 8_000,
      headers: { authorization: `Bearer ${this.accessToken}` }
    });
    return (payload.data || []).flatMap(record => {
      const event = createEvent({
        source: 'ACLED',
        sourceId: record.event_id_cnty || record.event_id_no_cnty,
        title: record.sub_event_type || record.event_type,
        category: category(record.event_type, record.sub_event_type),
        lat: record.latitude,
        lon: record.longitude,
        time: record.event_date,
        updatedAt: record.timestamp ? Number(record.timestamp) * 1000 : record.event_date,
        severity: severity(record),
        country: record.country,
        region: [record.admin1, record.admin2, record.location].filter(Boolean).join(', '),
        attributes: {
          eventType: record.event_type,
          subEventType: record.sub_event_type,
          fatalities: Number(record.fatalities || 0),
          actor1: record.actor1 || null,
          actor2: record.actor2 || null,
          disorderType: record.disorder_type || null,
          sourceScale: record.source_scale || null
        }
      });
      return event ? [event] : [];
    });
  }
}
