import { clampInteger, optionalString, requiredEnum } from '../core/validation.js';

const VERSION = '20.20.0-merlin';

function parseRssFeeds(value) {
  const defaults = [
    { id: 'bbc-world', name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', domain: 'bbc.co.uk' },
    { id: 'bbc-business', name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', domain: 'bbc.co.uk' },
    { id: 'bbc-technology', name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', domain: 'bbc.co.uk' },
    { id: 'bbc-science', name: 'BBC Science & Environment', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', domain: 'bbc.co.uk' },
    { id: 'guardian-world', name: 'The Guardian World', url: 'https://www.theguardian.com/world/rss', domain: 'theguardian.com' },
    { id: 'guardian-business', name: 'The Guardian Business', url: 'https://www.theguardian.com/uk/business/rss', domain: 'theguardian.com' },
    { id: 'guardian-technology', name: 'The Guardian Technology', url: 'https://www.theguardian.com/uk/technology/rss', domain: 'theguardian.com' },
    { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', domain: 'aljazeera.com' },
    { id: 'nasa-breaking', name: 'NASA Breaking News', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', domain: 'nasa.gov' }
  ];
  const text = optionalString(value, '');
  if (!text) return defaults;
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return defaults;
    return parsed.map((feed, index) => ({
      id: optionalString(feed.id, `feed-${index + 1}`),
      name: optionalString(feed.name, `Feed ${index + 1}`),
      url: optionalString(feed.url, ''),
      domain: optionalString(feed.domain, '')
    })).filter(feed => /^https?:\/\//i.test(feed.url)).slice(0, 30);
  } catch {
    return text.split(';').map((url, index) => ({ id: `feed-${index + 1}`, name: `Feed ${index + 1}`, url: url.trim(), domain: '' })).filter(feed => /^https?:\/\//i.test(feed.url)).slice(0, 30);
  }
}




function parseCountryCodes(value) {
  const text = optionalString(value, 'GB,US,CN,DE,FR,IN,JP,BR,SA,AE,TR,RU,EG,ZA,AU');
  return [...new Set(text.split(',').map(code => code.trim().toUpperCase()).filter(code => /^[A-Z]{2,3}$/.test(code)))].slice(0, 50);
}

function booleanValue(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return !['0', 'false', 'no', 'off'].includes(String(value).trim().toLowerCase());
}

function productionSecret(environment, value, name) {
  const secret = optionalString(value, environment === 'production' ? '' : `development-only-${name}-change-me`);
  if (environment === 'production' && secret.length < 32) throw new Error(`${name} must be at least 32 characters in production`);
  return secret;
}

function resolvePublicOrigin(env, environment) {
  const configuredOrigin = optionalString(env.PUBLIC_ORIGIN, '').replace(/\/$/, '');
  const renderHostname = optionalString(env.RENDER_EXTERNAL_HOSTNAME, '')
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '');

  if (configuredOrigin && !/^https?:\/\/(?:www\.)?example\.com(?::\d+)?$/i.test(configuredOrigin)) {
    return configuredOrigin;
  }

  if (renderHostname) return `https://${renderHostname}`;
  if (configuredOrigin) return configuredOrigin;
  return environment === 'production' ? 'https://example.com' : 'http://localhost:4173';
}

export function loadConfig(env = {}) {
  const environment = requiredEnum(env.NODE_ENV || 'development', ['development', 'test', 'production'], 'NODE_ENV');
  const reliefWebAppName = optionalString(env.RELIEFWEB_APP_NAME, '');
  return Object.freeze({
    version: VERSION,
    environment,
    isProduction: environment === 'production',
    host: optionalString(env.HOST, '0.0.0.0'),
    port: clampInteger(env.PORT, 4173, 1, 65_535),
    logLevel: requiredEnum(env.LOG_LEVEL || (environment === 'production' ? 'info' : 'debug'), ['debug', 'info', 'warn', 'error', 'fatal'], 'LOG_LEVEL'),
    mapStyleUrl: optionalString(env.MAP_STYLE_URL, '/api/map/tiles/streets/{z}/{x}/{y}.png'),
    mapTiles: Object.freeze({
      enabled: booleanValue(env.MAP_TILES_ENABLED, true),
      timeoutMs: clampInteger(env.MAP_TILE_TIMEOUT_MS, 8_000, 1_000, 30_000),
      maxZoom: clampInteger(env.MAP_TILE_MAX_ZOOM, 19, 8, 20)
    }),
    userAgent: optionalString(env.DATA_USER_AGENT, 'Merlin/20.0 intelligence-platform'),
    sourceRefreshMs: clampInteger(env.SOURCE_REFRESH_MS, 120_000, 30_000, 3_600_000),
    sourceStaleMs: clampInteger(env.SOURCE_STALE_MS, 900_000, 60_000, 86_400_000),
    httpTimeoutMs: clampInteger(env.HTTP_TIMEOUT_MS, 12_000, 1_000, 60_000),
    rateLimitPerMinute: clampInteger(env.RATE_LIMIT_PER_MINUTE, 240, 20, 10_000),
    requestTimeoutMs: clampInteger(env.REQUEST_TIMEOUT_MS, 30_000, 1_000, 120_000),
    ops: Object.freeze({
      enabled: booleanValue(env.OPS_ENABLED, true),
      runtimeSampleMs: clampInteger(env.RUNTIME_SAMPLE_MS, 10_000, 1_000, 60_000),
      slowRequestMs: clampInteger(env.SLOW_REQUEST_MS, 1_000, 100, 60_000),
      maximumEventLoopP95Ms: clampInteger(env.MAX_EVENT_LOOP_P95_MS, 250, 25, 5_000),
      allowedOrigins: Object.freeze(optionalString(env.ALLOWED_ORIGINS, '').split(',').map(value => value.trim()).filter(Boolean).slice(0, 20))
    }),
    accounts: Object.freeze({
      allowRegistration: booleanValue(env.ALLOW_REGISTRATION, true),
      sessionSecret: productionSecret(environment, env.SESSION_SECRET, 'SESSION_SECRET'),
      sessionTtlMs: clampInteger(env.SESSION_TTL_HOURS, 168, 1, 24 * 365) * 3_600_000,
      cookieName: optionalString(env.SESSION_COOKIE_NAME, 'merlin_session'),
      secureCookies: booleanValue(env.SECURE_COOKIES, environment === 'production'),
      publicOrigin: resolvePublicOrigin(env, environment),
      dataFile: optionalString(env.ACCOUNT_DATA_FILE, environment === 'test' ? `.tmp/accounts-test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.json` : 'runtime-data/accounts.json'),
      bootstrapOwner: Object.freeze({
        email: optionalString(env.OWNER_EMAIL, ''),
        password: optionalString(env.OWNER_PASSWORD, ''),
        displayName: optionalString(env.OWNER_DISPLAY_NAME, 'Owner')
      })
    }),
    billing: Object.freeze({
      stripe: Object.freeze({
        secretKey: optionalString(env.STRIPE_SECRET_KEY, ''),
        webhookSecret: optionalString(env.STRIPE_WEBHOOK_SECRET, ''),
        baseUrl: optionalString(env.STRIPE_BASE_URL, 'https://api.stripe.com'),
        priceIds: Object.freeze({ PRO: optionalString(env.STRIPE_PRICE_PRO, ''), TEAM: optionalString(env.STRIPE_PRICE_TEAM, '') })
      }),
      paypal: Object.freeze({
        clientId: optionalString(env.PAYPAL_CLIENT_ID, ''),
        clientSecret: optionalString(env.PAYPAL_CLIENT_SECRET, ''),
        webhookId: optionalString(env.PAYPAL_WEBHOOK_ID, ''),
        baseUrl: optionalString(env.PAYPAL_BASE_URL, 'https://api-m.paypal.com'),
        planIds: Object.freeze({ PRO: optionalString(env.PAYPAL_PLAN_PRO, ''), TEAM: optionalString(env.PAYPAL_PLAN_TEAM, '') })
      }),
      coinbase: Object.freeze({
        bearerToken: optionalString(env.COINBASE_BUSINESS_BEARER_TOKEN, ''),
        keyId: optionalString(env.COINBASE_API_KEY_ID, ''),
        keySecret: optionalString(env.COINBASE_API_KEY_SECRET, ''),
        webhookSecret: optionalString(env.COINBASE_WEBHOOK_SECRET, ''),
        baseUrl: optionalString(env.COINBASE_BUSINESS_BASE_URL, 'https://business.coinbase.com'),
        currency: optionalString(env.COINBASE_CURRENCY, 'USDC'),
        network: optionalString(env.COINBASE_NETWORK, 'base')
      })
    }),
    acled: Object.freeze({ accessToken: optionalString(env.ACLED_ACCESS_TOKEN, '') }),
    markets: Object.freeze({
      binanceEnabled: String(env.BINANCE_ENABLED || 'true').toLowerCase() !== 'false',
      binanceBaseUrl: optionalString(env.BINANCE_BASE_URL, 'https://api.binance.com'),
      coinGeckoEnabled: String(env.COINGECKO_ENABLED || 'true').toLowerCase() !== 'false',
      coinGeckoApiKey: optionalString(env.COINGECKO_API_KEY, ''),
      coinGeckoBaseUrl: optionalString(env.COINGECKO_BASE_URL, 'https://api.coingecko.com/api/v3'),
      alphaVantageApiKey: optionalString(env.ALPHA_VANTAGE_API_KEY, ''),
      alphaVantageBaseUrl: optionalString(env.ALPHA_VANTAGE_BASE_URL, 'https://www.alphavantage.co/query'),
      polymarketBaseUrl: optionalString(env.POLYMARKET_BASE_URL, 'https://gamma-api.polymarket.com')
    }),
    macro: Object.freeze({
      fredEnabled: booleanValue(env.FRED_ENABLED, true),
      fredBaseUrl: optionalString(env.FRED_BASE_URL, 'https://fred.stlouisfed.org/graph/fredgraph.csv')
    }),
    news: Object.freeze({
      gdeltEnabled: String(env.GDELT_ENABLED || 'true').toLowerCase() !== 'false',
      gdeltBaseUrl: optionalString(env.GDELT_BASE_URL, 'https://api.gdeltproject.org/api/v2/doc/doc'),
      rssFeeds: Object.freeze(parseRssFeeds(env.NEWS_RSS_FEEDS)),
      xBearerToken: optionalString(env.X_BEARER_TOKEN, ''),
      xBaseUrl: optionalString(env.X_BASE_URL, 'https://api.x.com/2/tweets/search/recent'),
      refreshMs: clampInteger(env.NEWS_REFRESH_MS, 120_000, 30_000, 3_600_000),
      staleMs: clampInteger(env.NEWS_STALE_MS, 900_000, 60_000, 86_400_000)
    }),
    intelligence: Object.freeze({
      worldBankEnabled: String(env.WORLD_BANK_ENABLED || 'true').toLowerCase() !== 'false',
      worldBankBaseUrl: optionalString(env.WORLD_BANK_BASE_URL, 'https://api.worldbank.org/v2'),
      ukPoliceEnabled: String(env.UK_POLICE_ENABLED || 'true').toLowerCase() !== 'false',
      ukPoliceBaseUrl: optionalString(env.UK_POLICE_BASE_URL, 'https://data.police.uk/api'),
      reliefWebAppName,
      reliefWebBaseUrl: optionalString(env.RELIEFWEB_BASE_URL, 'https://api.reliefweb.int/v2'),
      googleCivicApiKey: optionalString(env.GOOGLE_CIVIC_API_KEY, ''),
      googleCivicBaseUrl: optionalString(env.GOOGLE_CIVIC_BASE_URL, 'https://www.googleapis.com/civicinfo/v2'),
      nwsEnabled: booleanValue(env.NWS_ALERTS_ENABLED, true),
      ukFloodEnabled: booleanValue(env.UK_FLOOD_WARNINGS_ENABLED, true),
      reliefWebDisastersEnabled: Boolean(reliefWebAppName) && booleanValue(env.RELIEFWEB_DISASTERS_ENABLED, true),
      refreshMs: clampInteger(env.INTELLIGENCE_REFRESH_MS, 300_000, 60_000, 3_600_000),
      staleMs: clampInteger(env.INTELLIGENCE_STALE_MS, 3_600_000, 300_000, 604_800_000)
    }),
    liveData: Object.freeze({
      enabled: booleanValue(env.LIVE_DATA_ENABLED, true),
      autoStart: booleanValue(env.LIVE_DATA_AUTO_START, environment !== 'test'),
      refreshMs: clampInteger(env.LIVE_DATA_REFRESH_MS, 120_000, 30_000, 3_600_000),
      timeoutMs: clampInteger(env.LIVE_DATA_TIMEOUT_MS, 15_000, 1_000, 60_000),
      concurrency: clampInteger(env.LIVE_DATA_CONCURRENCY, 4, 1, 8),
      marinePortLimit: clampInteger(env.LIVE_DATA_MARINE_PORT_LIMIT, 5, 1, 12),
      dataFile: optionalString(env.LIVE_DATA_FILE, environment === 'test' ? `.tmp/live-data-test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.json` : 'runtime-data/live-data.json'),
      countries: Object.freeze(parseCountryCodes(env.LIVE_DATA_COUNTRIES)),
      ecbFxUrl: optionalString(env.ECB_FX_URL, 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'),
      unSanctionsUrl: optionalString(env.UN_SANCTIONS_URL, 'https://scsanctions.un.org/resources/xml/en/consolidated.xml'),
      portWatchCatalogUrl: optionalString(env.PORTWATCH_CATALOG_URL, 'https://portwatch.imf.org/api/search/v1'),
      coinbaseBaseUrl: optionalString(env.COINBASE_PUBLIC_BASE_URL, 'https://api.exchange.coinbase.com'),
      binanceBaseUrl: optionalString(env.BINANCE_PUBLIC_BASE_URL, 'https://api.binance.com')
    }),
    shipping: Object.freeze({
      portWatchBaseUrl: optionalString(env.PORTWATCH_BASE_URL, ''),
      portWatchPortField: optionalString(env.PORTWATCH_PORT_FIELD, 'portid'),
      noaaEnabled: String(env.NOAA_COOPS_ENABLED || 'true').toLowerCase() !== 'false',
      noaaBaseUrl: optionalString(env.NOAA_COOPS_BASE_URL, 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter'),
      ndbcEnabled: booleanValue(env.NOAA_NDBC_ENABLED, true),
      ndbcBaseUrl: optionalString(env.NOAA_NDBC_BASE_URL, 'https://www.ndbc.noaa.gov/data/realtime2'),
      comtradeEnabled: String(env.COMTRADE_ENABLED || 'true').toLowerCase() !== 'false',
      comtradeBaseUrl: optionalString(env.COMTRADE_BASE_URL, 'https://comtradeapi.un.org/public/v1/preview/C/A/HS'),
      comtradeSubscriptionKey: optionalString(env.COMTRADE_SUBSCRIPTION_KEY, ''),
      eiaApiKey: optionalString(env.EIA_API_KEY, ''),
      eiaRouteUrl: optionalString(env.EIA_SHIPPING_ROUTE_URL, ''),
      refreshMs: clampInteger(env.SHIPPING_REFRESH_MS, 300_000, 60_000, 3_600_000),
      staleMs: clampInteger(env.SHIPPING_STALE_MS, 3_600_000, 300_000, 604_800_000)
    })
  });
}
