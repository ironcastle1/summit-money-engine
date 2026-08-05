export class UnComtradePublicConnector {
  constructor(options = {}) {
    this.source = options.source;
    this.reporterCodes = options.reporterCodes || [826, 840, 156];
  }

  async fetch() {
    const period = String(new Date().getUTCFullYear() - 1);
    const settled = await Promise.allSettled(this.reporterCodes.map(reporterCode => this.source.tradeFlow({
      period,
      reporterCode,
      partnerCode: 0,
      flowCode: 'X',
      commodityCode: 'TOTAL',
      transportCode: 0,
      limit: 100
    })));
    const records = settled.flatMap(result => result.status === 'fulfilled' ? result.value.records || [] : []);
    if (!records.length) {
      throw Object.assign(new Error('UN Comtrade public preview returned no trade records'), { code: 'COMTRADE_NO_DATA' });
    }
    return {
      records,
      observedAt: new Date().toISOString(),
      metadata: { period, reporterCodes: this.reporterCodes, recordCount: records.length }
    };
  }
}
