import { BaseIntelligenceSource } from './base-source.js';

const INDICATORS = Object.freeze({
  population: 'SP.POP.TOTL', gdpUsd: 'NY.GDP.MKTP.CD', gdpPerCapitaUsd: 'NY.GDP.PCAP.CD',
  inflationPct: 'FP.CPI.TOTL.ZG', unemploymentPct: 'SL.UEM.TOTL.ZS', internetPct: 'IT.NET.USER.ZS',
  urbanPopulationPct: 'SP.URB.TOTL.IN.ZS', tradePctGdp: 'NE.TRD.GNFS.ZS', lifeExpectancyYears: 'SP.DYN.LE00.IN',
  homicideRate: 'VC.IHR.PSRC.P5', militarySpendPctGdp: 'MS.MIL.XPND.GD.ZS'
});

function latestValue(rows) {
  const values = Array.isArray(rows) ? rows.filter(row => Number.isFinite(Number(row?.value))) : [];
  values.sort((a, b) => Number(b.date) - Number(a.date));
  const row = values[0];
  return row ? { value: Number(row.value), year: Number(row.date), unit: row.unit || '' } : null;
}

export class WorldBankSource extends BaseIntelligenceSource {
  constructor(options) { super({ ...options, id: 'world-bank', name: 'World Bank Indicators', configured: options.enabled !== false, coverage: 'GLOBAL_COUNTRY' }); this.baseUrl = options.baseUrl; }

  async countryIndicators(iso2) {
    const code = String(iso2 || '').toUpperCase();
    return this.execute(`country:${code}`, async () => {
      const indicatorCodes = Object.values(INDICATORS).join(';');
      const url = new URL(`${this.baseUrl}/country/${encodeURIComponent(code)}/indicator/${indicatorCodes}`);
      for (const [key, value] of Object.entries({ format: 'json', source: 2, per_page: 500, date: '2018:2030' })) url.searchParams.set(key, String(value));
      const response = await this.http.json(url, { upstream: this.id });
      const rows = Array.isArray(response) ? response[1] : null;
      if (!Array.isArray(rows)) return { indicators: {}, recordCount: 0, sourceUpdatedAt: null };
      const grouped = new Map();
      for (const row of rows) {
        const id = row?.indicator?.id;
        if (!id) continue;
        if (!grouped.has(id)) grouped.set(id, []);
        grouped.get(id).push(row);
      }
      const indicators = {};
      for (const [name, id] of Object.entries(INDICATORS)) indicators[name] = latestValue(grouped.get(id));
      return { indicators, recordCount: rows.length, sourceUpdatedAt: new Date().toISOString(), countryCode: code };
    }, { refreshMs: 21_600_000, staleMs: 604_800_000 });
  }
}
