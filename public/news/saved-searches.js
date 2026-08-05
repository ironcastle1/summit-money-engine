const STORAGE_KEY = 'merlin.news-searches.v1';
const MAX_SEARCHES = 40;

function parse(value, fallback) { try { return JSON.parse(value); } catch { return fallback; } }
function read() {
  const value = parse(localStorage.getItem(STORAGE_KEY), []);
  return Array.isArray(value) ? value : [];
}
function write(value) { localStorage.setItem(STORAGE_KEY, JSON.stringify(value.slice(0, MAX_SEARCHES))); }
function identifier() { return globalThis.crypto?.randomUUID?.() || `news-search-${Date.now()}-${Math.random().toString(16).slice(2)}`; }

function normalize(input) {
  const now = new Date().toISOString();
  return Object.freeze({
    id: String(input.id || identifier()),
    name: String(input.name || input.query || 'SEARCH').trim().slice(0, 60),
    query: String(input.query || '').trim().slice(0, 240),
    hours: Math.max(1, Math.min(168, Number(input.hours || 24))),
    sourceType: String(input.sourceType || '').toUpperCase(),
    minimumVerification: Math.max(0, Math.min(100, Number(input.minimumVerification || 0))),
    sort: input.sort === 'relevance' ? 'relevance' : 'latest',
    createdAt: input.createdAt || now,
    updatedAt: now,
    runCount: Math.max(0, Number(input.runCount || 0)),
    lastRunAt: input.lastRunAt || null
  });
}

export class SavedNewsSearches {
  list() { return read().map(normalize); }
  save(input) {
    const item = normalize(input);
    const items = [item, ...this.list().filter(existing => existing.id !== item.id && existing.name.toLowerCase() !== item.name.toLowerCase())];
    write(items);
    return item;
  }
  remove(id) { write(this.list().filter(item => item.id !== id)); }
  get(id) { return this.list().find(item => item.id === id) || null; }
  recordRun(id) {
    const now = new Date().toISOString();
    write(this.list().map(item => item.id === id ? normalize({ ...item, runCount: item.runCount + 1, lastRunAt: now }) : item));
  }
  clear() { localStorage.removeItem(STORAGE_KEY); }
  export() { return { searches: this.list(), exportedAt: new Date().toISOString(), version: 1 }; }
  import(payload) {
    const searches = Array.isArray(payload?.searches) ? payload.searches.map(normalize) : [];
    const merged = new Map([...searches, ...this.list()].map(item => [item.id, item]));
    write([...merged.values()]);
    return this.list();
  }
}
