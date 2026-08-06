import { BaseSource } from './base-source.js';

export class SnapshotEventSource extends BaseSource {
  constructor(options = {}) {
    super({ id: 'snapshot', name: 'Local verified snapshot', weight: 2, refreshMs: 86_400_000, staleMs: 31_536_000_000, ...options });
    this.events = Object.freeze([...(options.events || [])]);
  }
  async fetchEvents() { return this.events; }
}
