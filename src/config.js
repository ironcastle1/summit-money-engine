import path from 'node:path';

const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const bool = (value, fallback=false) => value == null ? fallback : ['1','true','yes','on'].includes(String(value).toLowerCase());

export const config = Object.freeze({
  port: number(process.env.PORT, 3000),
  host: process.env.HOST || '0.0.0.0',
  dataDir: process.env.MERLIN_DATA_DIR || path.resolve('runtime'),
  refreshMs: Math.max(60_000, number(process.env.MERLIN_REFRESH_MS, 180_000)),
  sourceTimeoutMs: Math.max(2500, number(process.env.MERLIN_SOURCE_TIMEOUT_MS, 9000)),
  concurrency: Math.max(2, Math.min(12, number(process.env.MERLIN_MAX_SOURCE_CONCURRENCY, 7))),
  maxCurrentItems: Math.max(100, Math.min(1500, number(process.env.MERLIN_MAX_CURRENT_ITEMS, 700))),
  followUpMax: Math.max(0, Math.min(8, number(process.env.MERLIN_FOLLOWUP_MAX, 5))),
  followUpMinScore: Math.max(60, Math.min(95, number(process.env.MERLIN_FOLLOWUP_MIN_SCORE, 72))),
  fixtureMode: bool(process.env.MERLIN_FIXTURE_MODE),
  disableLiveRefresh: bool(process.env.MERLIN_DISABLE_LIVE_REFRESH),
  reliefWebAppName: process.env.RELIEFWEB_APPNAME || '',
  alphaVantageKey: process.env.ALPHA_VANTAGE_API_KEY || '',
  fredKey: process.env.FRED_API_KEY || '',
  currentWindowHours: 48,
  sourceRetentionHours: 72,
  marketRetentionHours: 8,
  sourceUserAgent: 'MerlinPublicSignals/7.0 (+public-data-aggregation)'
});
