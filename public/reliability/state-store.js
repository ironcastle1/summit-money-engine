export class ReliabilityState {
    constructor() { this.value = { loading: false, error: null, snapshot: null, query: '' }; this.listeners = new Set(); }
    get() { return this.value; }
    set(patch) {
        this.value = { ...this.value, ...patch };
        for (const listener of this.listeners)
            listener(this.value);
        return this.value;
    }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}
