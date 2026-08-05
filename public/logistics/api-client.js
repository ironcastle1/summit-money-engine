export class LogisticsApiClient {
  constructor(options = {}) { this.baseUrl = options.baseUrl || ''; this.timeoutMs = options.timeoutMs || 20_000; }
  async request(path, options = {}) {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), options.timeoutMs || this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, { method: options.method || 'GET', headers: { accept: 'application/json', ...(options.body ? { 'content-type': 'application/json' } : {}) }, body: options.body ? JSON.stringify(options.body) : undefined, credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
      const type = response.headers.get('content-type') || ''; const payload = type.includes('json') ? await response.json() : await response.text();
      if (!response.ok) throw Object.assign(new Error(payload?.error?.message || `HTTP ${response.status}`), { code: payload?.error?.code || 'LOGISTICS_API_ERROR', status: response.status, details: payload?.error?.details });
      return payload;
    } finally { clearTimeout(timeout); }
  }
  network() { return this.request('/api/logistics/network'); }
  diagnostics() { return this.request('/api/logistics/diagnostics'); }
  bottlenecks(limit = 50) { return this.request(`/api/logistics/bottlenecks?limit=${encodeURIComponent(limit)}`); }
  plan(body) { return this.request('/api/logistics/plan', { method: 'POST', body, timeoutMs: 30_000 }); }
  scenario(body) { return this.request('/api/logistics/scenario', { method: 'POST', body, timeoutMs: 35_000 }); }
  saved() { return this.request('/api/logistics/saved'); }
  save(body) { return this.request('/api/logistics/saved', { method: 'POST', body }); }
  removeSaved(id) { return this.request('/api/logistics/saved/remove', { method: 'POST', body: { id } }); }
  watchlist() { return this.request('/api/logistics/watchlist'); }
  addWatch(body) { return this.request('/api/logistics/watchlist', { method: 'POST', body }); }
  removeWatch(id) { return this.request('/api/logistics/watchlist/remove', { method: 'POST', body: { id } }); }
}
