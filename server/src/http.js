const cache = require('./cache');

async function fetchText(url, options = {}) {
  const timeout = options.timeout || 9000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SummitInfoCompiler/10.0 (+public-source-monitor)',
        'Accept': options.accept || 'application/json,text/xml,text/plain,*/*',
        ...(options.headers || {})
      }
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options = {}) {
  const text = await fetchText(url, { ...options, accept: 'application/json,*/*' });
  return JSON.parse(text);
}

async function cachedText(key, url, ttlMs, sourceName, options = {}) {
  const cached = cache.get(key);
  if (cached) return cached;
  try {
    const text = await fetchText(url, options);
    cache.mark(sourceName || key, 'OK', { detail: `loaded ${Math.round(text.length / 1024)} KB` });
    return cache.set(key, text, ttlMs);
  } catch (err) {
    cache.mark(sourceName || key, 'FAIL', { detail: err.message });
    throw err;
  }
}

async function cachedJson(key, url, ttlMs, sourceName, options = {}) {
  const cached = cache.get(key);
  if (cached) return cached;
  try {
    const json = await fetchJson(url, options);
    const count = Array.isArray(json) ? json.length : json && typeof json === 'object' ? Object.keys(json).length : 1;
    cache.mark(sourceName || key, 'OK', { detail: `loaded ${count} records` });
    return cache.set(key, json, ttlMs);
  } catch (err) {
    cache.mark(sourceName || key, 'FAIL', { detail: err.message });
    throw err;
  }
}

module.exports = { fetchText, fetchJson, cachedText, cachedJson };
