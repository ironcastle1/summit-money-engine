const RULES_KEY = 'merlin.alert-rules.v1';
const HISTORY_KEY = 'merlin.alert-history.v1';
const MAX_HISTORY = 250;

function parse(value, fallback) { try { return JSON.parse(value); } catch { return fallback; } }
function read(key, fallback = []) { const value = parse(localStorage.getItem(key), fallback); return Array.isArray(value) ? value : fallback; }
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function id() { return globalThis.crypto?.randomUUID?.() || `alert-${Date.now()}-${Math.random().toString(16).slice(2)}`; }

export class AlertRepository {
  rules() { return read(RULES_KEY); }
  saveRule(input) {
    const now = new Date().toISOString();
    const rule = { ...input, id: input.id || id(), createdAt: input.createdAt || now, updatedAt: now };
    write(RULES_KEY, [rule, ...this.rules().filter(item => item.id !== rule.id)].slice(0, 100));
    return rule;
  }
  removeRule(ruleId) { write(RULES_KEY, this.rules().filter(item => item.id !== ruleId)); }
  toggleRule(ruleId) { write(RULES_KEY, this.rules().map(item => item.id === ruleId ? { ...item, enabled: !item.enabled, updatedAt: new Date().toISOString() } : item)); }
  history() { return read(HISTORY_KEY); }
  addMatches(matches) {
    const current = this.history();
    const keyed = new Map([...matches, ...current].map(item => [item.id || `${item.rule?.id}:${item.targetId}:${item.triggeredAt}`, item]));
    write(HISTORY_KEY, [...keyed.values()].slice(0, MAX_HISTORY));
  }
  clearHistory() { localStorage.removeItem(HISTORY_KEY); }
}
