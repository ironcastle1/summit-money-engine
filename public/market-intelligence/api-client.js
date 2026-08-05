async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || 12_000);
  try {
    const response = await fetch(path, {
      method: options.method || 'GET',
      headers: options.body ? { 'content-type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error?.message || `Market intelligence request failed (${response.status})`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}
export class MarketIntelligenceApiClient {
  catalog() { return request('/api/market-intelligence/catalog'); }
  snapshot(options = {}) { return request('/api/market-intelligence/snapshot', { method: 'POST', body: options, timeoutMs: 18_000 }); }
  screen(options = {}) { return request('/api/market-intelligence/screen', { method: 'POST', body: options, timeoutMs: 18_000 }); }
  screens() { return request('/api/market-intelligence/screens'); }
  saveScreen(value) { return request('/api/market-intelligence/screens', { method: 'POST', body: value }); }
  removeScreen(id) { return request('/api/market-intelligence/screens/remove', { method: 'POST', body: { id } }); }
  watchlist() { return request('/api/market-intelligence/watchlist'); }
  addWatch(value) { return request('/api/market-intelligence/watchlist', { method: 'POST', body: value }); }
  removeWatch(id) { return request('/api/market-intelligence/watchlist/remove', { method: 'POST', body: { id } }); }
  alerts() { return request('/api/market-intelligence/alerts', { method: 'POST', body: {} }); }
  portfolio(value) { return request('/api/market-intelligence/portfolio', { method: 'POST', body: value, timeoutMs: 18_000 }); }
  scenario(value) { return request('/api/market-intelligence/scenario', { method: 'POST', body: value, timeoutMs: 18_000 }); }
}
