import { BaseIntelligenceSource } from './base-source.js';

export class ReliefWebSource extends BaseIntelligenceSource {
  constructor(options) {
    super({ ...options, id: 'reliefweb', name: 'ReliefWeb Reports', configured: Boolean(options.appName), coverage: 'GLOBAL_HUMANITARIAN' });
    this.baseUrl = options.baseUrl; this.appName = options.appName;
  }

  async reports(options = {}) {
    const country = String(options.country || '').trim();
    const query = String(options.query || '').trim();
    const limit = Math.max(1, Math.min(100, Number(options.limit || 30)));
    const cacheKey = `${country}:${query}:${limit}`.toLowerCase();
    return this.execute(cacheKey, async () => {
      const filters = [];
      if (country) filters.push({ field: 'country.name', value: country });
      const body = {
        appname: this.appName,
        limit,
        preset: 'latest',
        profile: 'list',
        fields: { include: ['id', 'title', 'date.created', 'date.changed', 'url', 'country', 'primary_country', 'source', 'theme', 'disaster', 'format'] }
      };
      if (query) body.query = { value: query };
      if (filters.length) body.filter = filters.length === 1 ? filters[0] : { operator: 'AND', conditions: filters };
      const url = new URL(`${this.baseUrl}/reports`);
      url.searchParams.set('appname', this.appName);
      delete body.appname;
      const payload = await this.http.json(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), upstream: this.id });
      const records = Array.isArray(payload?.data) ? payload.data : [];
      return {
        reports: records.map(item => ({ id: String(item.id), ...item.fields })),
        recordCount: records.length,
        totalCount: Number(payload?.totalCount || records.length)
      };
    }, { refreshMs: 900_000, staleMs: 86_400_000 });
  }
}
