import { BaseSource } from './base-source.js';
import { createEvent } from '../domain/events/event-schema.js';
import { decodeXml, extractTag, extractItems } from '../util/xml.js';

const FEED_URL = 'https://www.gdacs.org/xml/rss.xml';

function mapType(value) {
  const type = String(value || '').toUpperCase();
  if (type === 'EQ') return 'earthquake';
  if (type === 'TC') return 'storm';
  if (type === 'FL') return 'flood';
  if (type === 'VO') return 'volcano';
  if (type === 'DR') return 'drought';
  if (type === 'WF') return 'wildfire';
  return 'other';
}

function alertSeverity(level) {
  const normalized = String(level || '').toLowerCase();
  if (normalized.includes('red')) return 4.7;
  if (normalized.includes('orange')) return 3.5;
  if (normalized.includes('green')) return 1.8;
  return 2.2;
}

function parsePoint(value) {
  const [lat, lon] = String(value || '').trim().split(/\s+/).map(Number);
  return { lat, lon };
}

export class GdacsSource extends BaseSource {
  constructor(options) {
    super({ id: 'gdacs', name: 'GDACS', weight: 1, ...options });
  }

  async fetchEvents() {
    const xml = await this.http.text(FEED_URL, { upstream: this.id, attempts: 1, timeoutMs: 8_000, accept: 'application/rss+xml, application/xml, text/xml' });
    return extractItems(xml).flatMap(item => {
      const point = parsePoint(extractTag(item, 'georss:point'));
      const eventType = extractTag(item, 'gdacs:eventtype');
      const event = createEvent({
        source: 'GDACS',
        sourceId: extractTag(item, 'gdacs:eventid') || extractTag(item, 'guid'),
        title: decodeXml(extractTag(item, 'title')),
        category: mapType(eventType),
        lat: point.lat,
        lon: point.lon,
        time: extractTag(item, 'pubDate') || extractTag(item, 'gdacs:fromdate'),
        updatedAt: extractTag(item, 'pubDate'),
        severity: alertSeverity(extractTag(item, 'gdacs:alertlevel')),
        alertLevel: extractTag(item, 'gdacs:alertlevel'),
        country: decodeXml(extractTag(item, 'gdacs:country')),
        url: decodeXml(extractTag(item, 'link')),
        attributes: {
          eventType,
          episodeId: extractTag(item, 'gdacs:episodeid') || null,
          population: Number(extractTag(item, 'gdacs:population')) || null,
          severityText: decodeXml(extractTag(item, 'gdacs:severity')) || null
        }
      });
      return event ? [event] : [];
    });
  }
}
