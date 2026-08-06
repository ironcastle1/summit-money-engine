import { BaseShippingSource } from './base-shipping-source.js';
import { normalizeTradeRecords } from '../domain/shipping/trade.js';

export class UnComtradeSource extends BaseShippingSource {
  constructor(options) {
    super({ ...options, id: 'un-comtrade', name: 'UN Comtrade', configured: options.enabled !== false, capabilities: ['TRADE_FLOW'], refreshMs: 21_600_000, staleMs: 604_800_000 });
    this.baseUrl = options.baseUrl || 'https://comtradeapi.un.org/public/v1/preview/C/A/HS';
    this.subscriptionKey = options.subscriptionKey || '';
  }

  async tradeFlow(query) {
    const key = [query.period, query.reporterCode, query.partnerCode, query.flowCode, query.commodityCode, query.transportCode].join(':');
    return this.execute('TRADE_FLOW', key, async () => {
      const url = new URL(this.baseUrl);
      const params = {
        period: query.period, reporterCode: query.reporterCode, partnerCode: query.partnerCode || 0,
        flowCode: query.flowCode || 'X', cmdCode: query.commodityCode || 'TOTAL', partner2Code: 0,
        customsCode: 'C00', motCode: query.transportCode || 0, maxRecords: query.limit || 500,
        aggregateBy: 6, breakdownMode: 'classic', includeDesc: true
      };
      for (const [name, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== '') url.searchParams.set(name, String(value));
      const headers = this.subscriptionKey ? { 'Ocp-Apim-Subscription-Key': this.subscriptionKey } : {};
      const payload = await this.http.json(url, { upstream: this.id, headers, timeoutMs: 20_000 });
      if (payload?.error) throw Object.assign(new Error(payload.error.message || 'Comtrade error'), { code: 'COMTRADE_ERROR' });
      const records = normalizeTradeRecords(payload?.data || payload?.dataset || []);
      return { records, count: records.length, sourceUrl: String(url), period: query.period };
    }, { ttlMs: 21_600_000 });
  }
}
