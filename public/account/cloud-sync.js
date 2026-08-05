const BUCKETS = Object.freeze({
  watchlists: { key: 'merlin.market.watchlist.v1', fallback: [] },
  workspaces: { key: 'merlin.workspaces.v1', fallback: [] },
  alerts: { key: 'merlin.alert-rules.v1', fallback: [] },
  savedSearches: { key: 'merlin.news-searches.v1', fallback: [] },
  preferences: { key: 'merlin.preferences.v1', fallback: {} }
});

function parse(value, fallback) { try { return value ? JSON.parse(value) : structuredClone(fallback); } catch { return structuredClone(fallback); } }
function identifier(item) { return typeof item === 'string' ? item : item?.id || item?.name || JSON.stringify(item); }
function mergeArrays(local, remote) {
  const values = [...(Array.isArray(local) ? local : []), ...(Array.isArray(remote) ? remote : [])];
  return [...new Map(values.map(item => [identifier(item), item])).values()];
}

export class CloudSync {
  constructor(api) { this.api = api; }
  buckets() { return Object.keys(BUCKETS); }
  local(bucket) { const definition = BUCKETS[bucket]; return parse(localStorage.getItem(definition.key), definition.fallback); }
  saveLocal(bucket, value) { localStorage.setItem(BUCKETS[bucket].key, JSON.stringify(value)); window.dispatchEvent(new CustomEvent('merlin:cloud-data-updated', { detail: { bucket } })); }
  count(value) { return Array.isArray(value) ? value.length : Object.keys(value || {}).length; }
  async status(bucket) { const local = this.local(bucket); const remote = (await this.api.userData(bucket)).value; return { bucket, local: this.count(local), remote: this.count(remote), localValue: local, remoteValue: remote }; }
  async push(bucket) { const value = this.local(bucket); const result = await this.api.saveUserData(bucket, value); return { bucket, value: result.value, direction: 'PUSH' }; }
  async pull(bucket) { const result = await this.api.userData(bucket); this.saveLocal(bucket, result.value); return { bucket, value: result.value, direction: 'PULL' }; }
  async merge(bucket) {
    const local = this.local(bucket); const remote = (await this.api.userData(bucket)).value;
    const value = bucket === 'preferences' ? { ...(remote || {}), ...(local || {}) } : mergeArrays(local, remote);
    this.saveLocal(bucket, value); await this.api.saveUserData(bucket, value); return { bucket, value, direction: 'MERGE' };
  }
}
