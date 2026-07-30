import { BaseIntelligenceSource } from './base-source.js';

export class GoogleCivicSource extends BaseIntelligenceSource {
  constructor(options) { super({ ...options, id: 'google-civic', name: 'Google Civic Information', configured: Boolean(options.apiKey), coverage: 'SUPPORTED_ELECTIONS' }); this.baseUrl = options.baseUrl; this.apiKey = options.apiKey; }
  async elections() {
    return this.execute('elections', async () => {
      const response = await this.http.json(`${this.baseUrl}/elections`, { query: { key: this.apiKey } });
      const records = Array.isArray(response?.elections) ? response.elections : [];
      return { elections: records.map(item => ({ id: item.id, name: item.name, electionDay: item.electionDay, ocdDivisionId: item.ocdDivisionId || null })), recordCount: records.length };
    }, { refreshMs: 3_600_000, staleMs: 86_400_000 });
  }
}
