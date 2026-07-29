class TimedCache {
  constructor() {
    this.map = new Map();
    this.health = new Map();
  }
  get(key) {
    const row = this.map.get(key);
    if (!row) return null;
    if (row.expires < Date.now()) {
      this.map.delete(key);
      return null;
    }
    return row.value;
  }
  set(key, value, ttlMs) {
    this.map.set(key, { value, expires: Date.now() + ttlMs });
    return value;
  }
  mark(name, status, meta = {}) {
    this.health.set(name, { name, status, at: new Date().toISOString(), ...meta });
  }
  getHealth() {
    return [...this.health.values()].sort((a, b) => a.name.localeCompare(b.name));
  }
}
module.exports = new TimedCache();
