export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status || 0;
    this.code = options.code || 'API_ERROR';
    this.requestId = options.requestId || null;
    this.details = options.details || null;
  }
}

export function createApiClient(options = {}) {
  const baseUrl = options.baseUrl || '';
  const timeoutMs = options.timeoutMs || 20_000;
  let csrfToken = null;

  async function get(path, params = {}, requestOptions = {}) {
    const url = new URL(`${baseUrl}${path}`, window.location.origin);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) url.searchParams.set(key, value.join(','));
      else url.searchParams.set(key, String(value));
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestOptions.timeoutMs || timeoutMs);
    try {
      const response = await fetch(url, { headers: { accept: 'application/json', 'x-client-version': '16.9.1-recovery' }, credentials: 'same-origin', signal: requestOptions.signal || controller.signal, cache: 'no-store' });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const error = body?.error || {};
        throw new ApiError(error.message || `HTTP ${response.status}`, { status: response.status, code: error.code, requestId: error.requestId, details: error.details });
      }
      return body;
    } catch (error) {
      if (error.name === 'AbortError') throw new ApiError('Request timed out', { code: 'TIMEOUT' });
      throw error;
    } finally { clearTimeout(timeout); }
  }

  async function post(path, body, requestOptions = {}) {
    const url = new URL(`${baseUrl}${path}`, window.location.origin);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestOptions.timeoutMs || timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json', 'x-client-version': '16.9.1-recovery', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify(body || {}),
        credentials: 'same-origin',
        signal: requestOptions.signal || controller.signal,
        cache: 'no-store'
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const error = payload?.error || {};
        throw new ApiError(error.message || `HTTP ${response.status}`, { status: response.status, code: error.code, requestId: error.requestId, details: error.details });
      }
      return payload;
    } catch (error) {
      if (error.name === 'AbortError') throw new ApiError('Request timed out', { code: 'TIMEOUT' });
      throw error;
    } finally { clearTimeout(timeout); }
  }

  return Object.freeze({
    config: () => get('/api/config'),
    health: () => get('/api/health'),
    diagnostics: () => get('/api/diagnostics'),
    sources: () => get('/api/sources'),
    events: params => get('/api/events', params),
    scan: params => get('/api/scan', params),
    search: params => get('/api/search', params),
    reverse: params => get('/api/reverse', params),
    routes: () => get('/api/routes'),
    marketCatalog: params => get('/api/markets/catalog', params),
    marketSources: () => get('/api/markets/sources'),
    marketQuote: params => get('/api/markets/quote', params),
    marketCandles: params => get('/api/markets/candles', params),
    marketAnalysis: (params, requestOptions) => get('/api/markets/analyse', params, requestOptions),
    marketScreener: (params, requestOptions) => get('/api/markets/screener', params, requestOptions),
    marketMultiTimeframe: (params, requestOptions) => get('/api/markets/multi-timeframe', params, requestOptions),
    newsSources: () => get('/api/news/sources'),
    news: (params, requestOptions) => get('/api/news', params, requestOptions),
    newsStory: params => get('/api/news/story', params),
    shippingCatalog: params => get('/api/shipping/catalog', params),
    shippingSources: () => get('/api/shipping/sources'),
    shippingSnapshot: (params, requestOptions) => get('/api/shipping/snapshot', params, requestOptions),
    shippingPort: params => get('/api/shipping/port', params),
    shippingChokepoint: params => get('/api/shipping/chokepoint', params),
    shippingRoute: params => get('/api/shipping/route', params),
    shippingImpact: params => get('/api/shipping/impact', params),
    shippingTrade: (params, requestOptions) => get('/api/shipping/trade', params, requestOptions),
    shippingCommodity: params => get('/api/shipping/commodity', params),
    intelligenceCatalog: params => get('/api/intelligence/catalog', params),
    intelligenceSources: () => get('/api/intelligence/sources'),
    intelligenceOverview: (params, requestOptions) => get('/api/intelligence/overview', params, requestOptions),
    intelligenceCountry: (params, requestOptions) => get('/api/intelligence/country', params, requestOptions),
    intelligenceCity: (params, requestOptions) => get('/api/intelligence/city', params, requestOptions),
    intelligencePoint: (params, requestOptions) => get('/api/intelligence/point', params, requestOptions),
    intelligenceCrime: params => get('/api/intelligence/crime', params),
    intelligenceElections: params => get('/api/intelligence/elections', params),
    predictionMarkets: params => get('/api/prediction-markets', params),
    opportunities: (params, requestOptions) => get('/api/opportunities', params, requestOptions),
    marketReplay: (params, requestOptions) => get('/api/replay/market', params, requestOptions),
    evaluateAlerts: (body, requestOptions) => post('/api/alerts/evaluate', body, requestOptions),
    setCsrfToken: value => { csrfToken = value || null; },
    authSession: () => get('/api/auth/session'),
    register: body => post('/api/auth/register', body),
    login: body => post('/api/auth/login', body),
    logout: () => post('/api/auth/logout', {}),
    updateProfile: body => post('/api/account/profile', body),
    changePassword: body => post('/api/account/password', body),
    billingPlans: () => get('/api/billing/plans'),
    billingSubscription: () => get('/api/billing/subscription'),
    createCheckout: body => post('/api/billing/checkout', body),
    userData: bucket => get(`/api/user-data/${encodeURIComponent(bucket)}`),
    saveUserData: (bucket, value) => post(`/api/user-data/${encodeURIComponent(bucket)}`, { value }),
    adminMetrics: () => get('/api/admin/metrics'),
    adminUsers: params => get('/api/admin/users', params),
    adminAudit: params => get('/api/admin/audit', params),
    adminSetRole: (userId, role) => post(`/api/admin/users/${encodeURIComponent(userId)}/role`, { role }),
    adminSetStatus: (userId, status) => post(`/api/admin/users/${encodeURIComponent(userId)}/status`, { status }),
    adminGrantPlan: (userId, body) => post(`/api/admin/users/${encodeURIComponent(userId)}/subscription`, body),
    opsHealth: () => get('/api/ops/health'),
    opsQuality: () => get('/api/ops/quality'),
    opsBuild: () => get('/api/ops/build'),
    opsMetrics: () => get('/api/ops/metrics'),
    opsClientReports: () => get('/api/ops/client-reports'),
    reportClientMetric: body => post('/api/ops/client-report', body)
  });
}
