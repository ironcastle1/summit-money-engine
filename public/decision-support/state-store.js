const STORAGE = 'merlin.decision-support.v20';
function read() { try { return JSON.parse(localStorage.getItem(STORAGE) || '{}'); } catch { return {}; } }
export class DecisionSupportState {
  constructor() { this.state = { activeTab: 'brief', minimumPriority: 45, domains: [], selectedSignalId: null, selectedCaseId: null, ...read() }; this.listeners = new Set(); }
  get() { return this.state; }
  set(patch) { this.state = { ...this.state, ...patch }; localStorage.setItem(STORAGE, JSON.stringify(this.state)); for (const listener of this.listeners) listener(this.state); return this.state; }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}
