import { BaseSource } from './base-source.js';
import { createEvent } from '../domain/events/event-schema.js';

const FEED_URL = 'https://environment.data.gov.uk/flood-monitoring/id/floods';

function score(severity) {
  const n = Number(severity);
  if (n === 1) return 5;
  if (n === 2) return 4;
  if (n === 3) return 3;
  if (n === 4) return 1.5;
  return 2;
}

export class UkFloodSource extends BaseSource {
  constructor(options) { super({ id: 'uk-floods', name: 'UK Environment Agency Flood Warnings', weight: 1, ...options }); }
  async fetchEvents() {
    const payload = await this.http.json(FEED_URL, { upstream: this.id, attempts: 2, timeoutMs: 12_000 });
    return (payload.items || []).flatMap(item => {
      const area = item.floodArea || {};
      const lat = Number(area.lat ?? item.lat);
      const lon = Number(area.long ?? area.lon ?? item.long);
      const event = createEvent({
        source: 'UK ENVIRONMENT AGENCY', sourceId: item.floodAreaID || item['@id'],
        title: item.description || item.message || 'Flood warning', category: 'flood', lat, lon,
        time: item.timeRaised || item.timeMessageChanged || item.timeSeverityChanged,
        updatedAt: item.timeMessageChanged || item.timeSeverityChanged || item.timeRaised,
        severity: score(item.severityLevel), alertLevel: item.severity,
        region: area.riverOrSea || area.description || item.eaAreaName,
        url: item['@id'],
        attributes: { severityLevel: Number(item.severityLevel) || null, message: item.message || null, county: area.county || null, notation: area.notation || null }
      });
      return event ? [event] : [];
    });
  }
}
