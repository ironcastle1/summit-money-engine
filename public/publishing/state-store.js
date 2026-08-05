export class PublishingState {
  constructor() {
    this.value = Object.freeze({ query: '', selectedPublicationId: null, selectedEditionId: null, tab: 'PUBLICATIONS', loading: false, error: null });
    this.listeners = new Set();
  }
  get() { return this.value; }
  set(changes) { this.value = Object.freeze({ ...this.value, ...changes }); for (const listener of this.listeners) listener(this.value); return this.value; }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}
