class CacheStore {
  constructor() {
    this.rows = new Map();
  }
  get(key) {
    const row = this.rows.get(key);
    if (!row) return null;
    if (row.expiresAt && row.expiresAt < Date.now()) {
      this.rows.delete(key);
      return null;
    }
    return row.value;
  }
  set(key, value, ttlMs) {
    this.rows.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : null });
    return value;
  }
  del(key) {
    this.rows.delete(key);
  }
  clear() {
    this.rows.clear();
  }
}

module.exports = new CacheStore();
