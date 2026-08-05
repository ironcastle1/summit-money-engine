export class SecurityState {
  constructor() {
    this.value = Object.freeze({ snapshot: null, loading: false, error: null, query: '', tab: 'POSTURE' });
    this.listeners = new Set();
  }
  get() { return this.value; }
  set(patch) {
    this.value = Object.freeze({ ...this.value, ...patch });
    for (const listener of this.listeners) listener(this.value);
    return this.value;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
