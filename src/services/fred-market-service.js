const SERIES = Object.freeze([
  { id: 'DCOILBRENTEU', key: 'brent', name: 'Brent crude', unit: 'US$/barrel' },
  { id: 'DCOILWTICO', key: 'wti', name: 'WTI crude', unit: 'US$/barrel' },
  { id: 'DHHNGSP', key: 'natural-gas', name: 'Natural gas', unit: 'US$/MMBtu' },
  { id: 'GOLDAMGBD228NLBM', key: 'gold', name: 'Gold', unit: 'US$/troy oz' },
  { id: 'DEXUSEU', key: 'eurusd', name: 'EUR/USD', unit: 'USD per EUR' },
  { id: 'DEXUSUK', key: 'gbpusd', name: 'GBP/USD', unit: 'USD per GBP' }
]);

function parseCsv(text) {
  const lines = String(text || '').trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => {
    const comma = line.indexOf(',');
    const date = line.slice(0, comma).trim();
    const value = Number(line.slice(comma + 1).trim());
    return Number.isFinite(value) ? { date, value } : null;
  }).filter(Boolean);
}

export class FredMarketService {
  constructor(options = {}) {
    this.http = options.http;
    this.cache = options.cache;
    this.logger = options.logger;
    this.baseUrl = options.baseUrl || 'https://fred.stlouisfed.org/graph/fredgraph.csv';
  }

  catalog() { return SERIES.map(item => ({ ...item })); }

  async snapshot() {
    const results = await Promise.all(SERIES.map(series => this.#series(series)));
    return { records: results, source: 'Federal Reserve Economic Data', generatedAt: new Date().toISOString() };
  }

  async #series(series) {
    try {
      const result = await this.cache.getOrLoad(`fred:${series.id}`, { ttlMs: 3_600_000, staleMs: 86_400_000 }, async () => {
        const url = new URL(this.baseUrl);
        url.searchParams.set('id', series.id);
        const text = await this.http.text(url, { upstream: 'fred', attempts: 2, timeoutMs: 12_000, accept: 'text/csv' });
        return parseCsv(text).slice(-3);
      });
      const rows = result.value;
      const latest = rows.at(-1) || null;
      const previous = rows.at(-2) || null;
      const changePercent = latest && previous && previous.value !== 0 ? ((latest.value / previous.value) - 1) * 100 : null;
      return { ...series, value: latest?.value ?? null, date: latest?.date ?? null, previousValue: previous?.value ?? null, changePercent, state: latest ? (result.cache === 'STALE' ? 'DELAYED' : 'ONLINE') : 'NO_DATA', cache: result.cache };
    } catch (error) {
      this.logger?.warn('fred.series_failed', { series: series.id, error });
      return { ...series, value: null, date: null, previousValue: null, changePercent: null, state: 'OFFLINE', errorCode: error.code || error.name || 'FRED_ERROR' };
    }
  }
}
