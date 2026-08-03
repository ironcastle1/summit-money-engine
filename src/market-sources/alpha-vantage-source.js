import { UpstreamError } from '../core/errors.js';
import { normalizeCandles } from '../domain/markets/candle-schema.js';
import { timeframe } from '../domain/markets/timeframes.js';
import { BaseMarketSource } from './base-market-source.js';

function detectTimeSeries(data) {
  return Object.entries(data || {}).find(([key, value]) => key.toLowerCase().includes('time series') && value && typeof value === 'object')?.[1] || null;
}

function parseTimestamp(value) {
  const normalized = value.length === 10 ? `${value}T00:00:00Z` : `${value.replace(' ', 'T')}Z`;
  return Date.parse(normalized);
}

export class AlphaVantageSource extends BaseMarketSource {
  constructor(options) {
    super({ ...options, id: 'alphavantage', name: 'Alpha Vantage', configured: Boolean(options.apiKey), supportedAssetClasses: ['equity', 'etf', 'index', 'forex', 'commodity'], quoteTtlMs: 60_000, candleTtlMs: 300_000, staleMs: 3_600_000 });
    this.apiKey = options.apiKey || '';
    this.baseUrl = String(options.baseUrl || 'https://www.alphavantage.co/query');
  }

  supports(asset, operation, timeframeId) {
    if (!super.supports(asset, operation, timeframeId)) return false;
    if (operation === 'candles') return Boolean(timeframe(timeframeId).alphaVantage);
    return true;
  }

  async request(params) {
    const url = new URL(this.baseUrl);
    for (const [key, value] of Object.entries({ ...params, apikey: this.apiKey })) url.searchParams.set(key, value);
    const data = await this.http.json(url, { upstream: this.id, attempts: 1 });
    const message = data?.Note || data?.Information || data?.['Error Message'];
    if (message) throw new UpstreamError(String(message), { upstream: this.id, code: 'ALPHA_VANTAGE_RESPONSE_ERROR' });
    return data;
  }

  async fetchQuote(asset) {
    const mapping = asset.sources.alphavantage;
    if (asset.assetClass === 'forex') {
      const data = await this.request({ function: 'CURRENCY_EXCHANGE_RATE', from_currency: asset.baseCurrency, to_currency: asset.quoteCurrency });
      const row = data?.['Realtime Currency Exchange Rate'];
      const price = Number(row?.['5. Exchange Rate']);
      if (!Number.isFinite(price) || price <= 0) throw new UpstreamError('Alpha Vantage returned an invalid forex quote', { upstream: this.id });
      return {
        assetId: asset.id, symbol: asset.symbol, price, quoteCurrency: asset.quoteCurrency,
        bid: Number(row?.['8. Bid Price']) || null, ask: Number(row?.['9. Ask Price']) || null,
        marketTime: Date.parse(row?.['6. Last Refreshed']?.replace(' ', 'T') + 'Z') || Date.now(),
        receivedAt: new Date().toISOString()
      };
    }
    const data = await this.request({ function: 'GLOBAL_QUOTE', symbol: mapping.symbol });
    const row = data?.['Global Quote'];
    const price = Number(row?.['05. price']);
    if (!Number.isFinite(price) || price <= 0) throw new UpstreamError('Alpha Vantage returned an invalid quote', { upstream: this.id });
    return {
      assetId: asset.id, symbol: asset.symbol, price,
      open24h: Number(row?.['02. open']) || null, high24h: Number(row?.['03. high']) || null, low24h: Number(row?.['04. low']) || null,
      change24h: Number(String(row?.['10. change percent'] || '').replace('%', '')) / 100,
      baseVolume24h: Number(row?.['06. volume']) || null, quoteCurrency: mapping.quoteCurrency || asset.quoteCurrency,
      marketTime: Date.parse(`${row?.['07. latest trading day']}T00:00:00Z`) || Date.now(), receivedAt: new Date().toISOString()
    };
  }

  async fetchCandles(asset, timeframeId, limit) {
    const mapping = asset.sources.alphavantage;
    const definition = timeframe(timeframeId);
    let params;
    if (asset.assetClass === 'forex') {
      if (timeframeId === '1d') params = { function: 'FX_DAILY', from_symbol: asset.baseCurrency, to_symbol: asset.quoteCurrency, outputsize: limit > 100 ? 'full' : 'compact' };
      else if (timeframeId === '1w') params = { function: 'FX_WEEKLY', from_symbol: asset.baseCurrency, to_symbol: asset.quoteCurrency };
      else params = { function: 'FX_INTRADAY', from_symbol: asset.baseCurrency, to_symbol: asset.quoteCurrency, interval: definition.alphaVantage, outputsize: limit > 100 ? 'full' : 'compact' };
    } else if (timeframeId === '1d') params = { function: 'TIME_SERIES_DAILY', symbol: mapping.symbol, outputsize: limit > 100 ? 'full' : 'compact' };
    else if (timeframeId === '1w') params = { function: 'TIME_SERIES_WEEKLY', symbol: mapping.symbol };
    else params = { function: 'TIME_SERIES_INTRADAY', symbol: mapping.symbol, interval: definition.alphaVantage, outputsize: limit > 100 ? 'full' : 'compact' };
    const data = await this.request(params);
    const series = detectTimeSeries(data);
    if (!series) throw new UpstreamError('Alpha Vantage returned no time series', { upstream: this.id });
    const rows = Object.entries(series).map(([timestamp, row]) => ({
      timestamp: parseTimestamp(timestamp),
      open: row['1. open'], high: row['2. high'], low: row['3. low'], close: row['4. close'], volume: row['5. volume'] || 0
    }));
    return normalizeCandles(rows).slice(-limit);
  }
}
