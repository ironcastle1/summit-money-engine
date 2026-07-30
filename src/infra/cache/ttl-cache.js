export class TtlCache {
  #entries = new Map();
  #inflight = new Map();
  #maxEntries;

  constructor(options = {}) {
    this.#maxEntries = options.maxEntries || 500;
  }

  get(key, now = Date.now()) {
    const entry = this.#entries.get(key);
    if (!entry) return null;
    entry.hits += 1;
    entry.lastAccessedAt = now;
    return {
      value: entry.value,
      fresh: now < entry.expiresAt,
      stale: now >= entry.expiresAt,
      ageMs: now - entry.createdAt,
      expiresAt: entry.expiresAt,
      metadata: entry.metadata || null
    };
  }

  set(key, value, ttlMs, metadata = null, now = Date.now()) {
    this.#entries.set(key, {
      value,
      metadata,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + Math.max(0, ttlMs),
      hits: 0
    });
    this.#evict();
    return value;
  }

  delete(key) {
    this.#entries.delete(key);
  }

  clear() {
    this.#entries.clear();
    this.#inflight.clear();
  }

  async getOrLoad(key, options, loader) {
    const ttlMs = options.ttlMs || 60_000;
    const staleMs = options.staleMs || 0;
    const cached = this.get(key);
    if (cached?.fresh) return { value: cached.value, cache: 'HIT', ageMs: cached.ageMs };
    if (this.#inflight.has(key)) return this.#inflight.get(key);

    const task = (async () => {
      try {
        const value = await loader();
        this.set(key, value, ttlMs, options.metadata);
        return { value, cache: cached ? 'REFRESH' : 'MISS', ageMs: 0 };
      } catch (error) {
        if (cached && cached.ageMs <= ttlMs + staleMs) {
          return { value: cached.value, cache: 'STALE', ageMs: cached.ageMs, error };
        }
        throw error;
      } finally {
        this.#inflight.delete(key);
      }
    })();

    this.#inflight.set(key, task);
    return task;
  }

  stats(now = Date.now()) {
    let fresh = 0;
    let stale = 0;
    let hits = 0;
    for (const entry of this.#entries.values()) {
      if (now < entry.expiresAt) fresh += 1;
      else stale += 1;
      hits += entry.hits;
    }
    return { entries: this.#entries.size, fresh, stale, inflight: this.#inflight.size, hits };
  }

  #evict() {
    if (this.#entries.size <= this.#maxEntries) return;
    const entries = [...this.#entries.entries()].sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt);
    const count = this.#entries.size - this.#maxEntries;
    for (let index = 0; index < count; index += 1) this.#entries.delete(entries[index][0]);
  }
}
