import { BaseIntelligenceSource } from './base-source.js';

function monthOffset(monthsBack = 2) {
  const date = new Date();
  date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() - monthsBack);
  return date.toISOString().slice(0, 7);
}

export class UkPoliceSource extends BaseIntelligenceSource {
  constructor(options) { super({ ...options, id: 'uk-police', name: 'UK Police Street Crime', configured: options.enabled !== false, coverage: 'UNITED_KINGDOM_POINT' }); this.baseUrl = options.baseUrl; }
  supports(countryCode) { return String(countryCode || '').toUpperCase() === 'GB'; }

  async crimesAt(point, options = {}) {
    const supported = this.supports(options.countryCode);
    const date = options.date || monthOffset(2);
    const lat = Number(point.lat).toFixed(5); const lon = Number(point.lon).toFixed(5);
    return this.execute(`street:${lat}:${lon}:${date}`, async () => {
      const url = new URL(`${this.baseUrl}/crimes-street/all-crime`);
      for (const [key, value] of Object.entries({ lat, lng: lon, date })) url.searchParams.set(key, value);
      const response = await this.http.json(url, { upstream: this.id });
      const records = Array.isArray(response) ? response : [];
      const categories = {};
      for (const crime of records) categories[crime.category] = (categories[crime.category] || 0) + 1;
      return {
        records: records.slice(0, 1000).map(crime => ({
          id: crime.persistent_id || crime.id || null, category: crime.category, month: crime.month,
          street: crime.location?.street?.name || null, lat: Number(crime.location?.latitude), lon: Number(crime.location?.longitude),
          outcome: crime.outcome_status?.category || null
        })),
        categories, recordCount: records.length, period: date,
        lastUpdated: null
      };
    }, { supported, refreshMs: 21_600_000, staleMs: 604_800_000 });
  }

  async lastUpdated() {
    return this.execute('last-updated', async () => this.http.json(`${this.baseUrl}/crime-last-updated`, { upstream: this.id }), { refreshMs: 21_600_000, staleMs: 604_800_000 });
  }
}
