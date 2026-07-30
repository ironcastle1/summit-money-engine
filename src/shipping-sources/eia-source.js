import { BaseShippingSource } from './base-shipping-source.js';

export class EiaShippingSource extends BaseShippingSource {
  constructor(options) {
    super({ ...options, id: 'eia', name: 'U.S. EIA', configured: Boolean(options.apiKey && options.routeUrl), capabilities: ['ENERGY_FLOW'], refreshMs: 3_600_000, staleMs: 86_400_000 });
    this.apiKey = options.apiKey || '';
    this.routeUrl = options.routeUrl || '';
  }

  async energyFlow(query = {}) {
    const key = JSON.stringify(query);
    return this.execute('ENERGY_FLOW', key, async () => {
      const url = new URL(this.routeUrl);
      url.searchParams.set('api_key', this.apiKey);
      url.searchParams.set('frequency', query.frequency || 'monthly');
      url.searchParams.set('data[0]', query.dataField || 'value');
      url.searchParams.set('sort[0][column]', 'period');
      url.searchParams.set('sort[0][direction]', 'desc');
      url.searchParams.set('length', String(query.limit || 120));
      for (const [name, values] of Object.entries(query.facets || {})) for (const value of [].concat(values)) url.searchParams.append(`facets[${name}][]`, value);
      const payload = await this.http.json(url, { upstream: this.id, timeoutMs: 20_000 });
      const records = payload?.response?.data || [];
      return { records, count: records.length, sourceUrl: String(url), warnings: payload?.response?.warnings || [] };
    });
  }
}
