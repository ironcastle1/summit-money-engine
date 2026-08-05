export class LogisticsStateStore extends EventTarget {
  constructor(initial = {}) { super(); this.state = Object.freeze({ open: false, loading: false, network: null, result: null, scenario: null, error: null, activeTab: 'PLAN', selectedRouteId: null, ...initial }); }
  get() { return this.state; }
  set(patch, reason = 'state.changed') { this.state = Object.freeze({ ...this.state, ...patch }); this.dispatchEvent(new CustomEvent('change', { detail: { state: this.state, reason } })); return this.state; }
  subscribe(listener) { const handler = event => listener(event.detail.state, event.detail.reason); this.addEventListener('change', handler); return () => this.removeEventListener('change', handler); }
}
