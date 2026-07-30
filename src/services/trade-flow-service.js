import { aggregateTrade, tradeConcentration } from '../domain/shipping/trade.js';

export class TradeFlowService {
  constructor(options) { this.sources = options.sources; this.catalog = options.catalog; }

  async query(input) {
    const source = this.sources.get('un-comtrade');
    if (!source) throw Object.assign(new Error('UN Comtrade source unavailable'), { code: 'TRADE_SOURCE_UNAVAILABLE' });
    const result = await source.tradeFlow(input);
    const records = result.value?.records || [];
    return {
      query: input, source: result.source, cache: result.cache, stale: result.stale,
      records, byPartner: aggregateTrade(records, 'partner').slice(0, 40), byCommodity: aggregateTrade(records, 'commodity').slice(0, 40),
      partnerConcentration: tradeConcentration(records, 'partner'), commodityConcentration: tradeConcentration(records, 'commodity'),
      generatedAt: new Date().toISOString()
    };
  }
}
