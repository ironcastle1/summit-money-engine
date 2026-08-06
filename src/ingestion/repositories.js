function clone(value) { return structuredClone(value); }

export class IngestionCheckpointRepository {
  #store = new Map();
  get(sourceId, partition = 'default') { return clone(this.#store.get(`${sourceId}:${partition}`) || null); }
  set(sourceId, partition, checkpoint) {
    const value = { sourceId, partition, checkpoint: clone(checkpoint), updatedAt: new Date().toISOString() };
    this.#store.set(`${sourceId}:${partition}`, value);
    return clone(value);
  }
  delete(sourceId, partition = 'default') { return this.#store.delete(`${sourceId}:${partition}`); }
  list(sourceId = null) { return [...this.#store.values()].filter(item => !sourceId || item.sourceId === sourceId).map(clone); }
}

export class DeadLetterRepository {
  #records = [];
  constructor(options = {}) { this.maximum = Math.max(10, Number(options.maximum || 5_000)); }
  add(entry) {
    const value = { id: entry.id || crypto.randomUUID(), createdAt: new Date().toISOString(), attempts: 1, resolvedAt: null, ...clone(entry) };
    this.#records.push(value);
    if (this.#records.length > this.maximum) this.#records.splice(0, this.#records.length - this.maximum);
    return clone(value);
  }
  list(options = {}) {
    return this.#records.filter(item => !options.sourceId || item.sourceId === options.sourceId)
      .filter(item => options.includeResolved || !item.resolvedAt).slice(-(options.limit || 100)).reverse().map(clone);
  }
  resolve(id, resolution = {}) {
    const item = this.#records.find(record => record.id === id);
    if (!item) return null;
    item.resolvedAt = new Date().toISOString();
    item.resolution = clone(resolution);
    return clone(item);
  }
  stats() { return { total: this.#records.length, unresolved: this.#records.filter(item => !item.resolvedAt).length }; }
}

export class ProvenanceRepository {
  #entries = new Map();
  constructor(options = {}) { this.maximum = Math.max(100, Number(options.maximum || 50_000)); }
  add(entry) {
    this.#entries.set(entry.id, clone(entry));
    if (this.#entries.size > this.maximum) this.#entries.delete(this.#entries.keys().next().value);
    return clone(entry);
  }
  byRecord(recordId) { return [...this.#entries.values()].filter(item => item.recordId === recordId).map(clone); }
  bySource(sourceId, limit = 100) { return [...this.#entries.values()].filter(item => item.sourceId === sourceId).slice(-limit).reverse().map(clone); }
  list(limit = 100) { return [...this.#entries.values()].slice(-limit).reverse().map(clone); }
  stats() {
    const bySource = {};
    for (const entry of this.#entries.values()) bySource[entry.sourceId] = (bySource[entry.sourceId] || 0) + 1;
    return { entries: this.#entries.size, bySource };
  }
}

export class IngestionRunRepository {
  #runs = [];
  constructor(options = {}) { this.maximum = Math.max(10, Number(options.maximum || 200)); }
  add(run) {
    this.#runs.push(clone(run));
    if (this.#runs.length > this.maximum) this.#runs.splice(0, this.#runs.length - this.maximum);
    return clone(run);
  }
  latest() { return clone(this.#runs.at(-1) || null); }
  list(limit = 25) { return this.#runs.slice(-limit).reverse().map(clone); }
}
