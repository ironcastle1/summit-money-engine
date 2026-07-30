export class AlertCooldownRegistry {
  #entries = new Map();

  key(ruleId, targetId) { return `${ruleId}:${targetId}`; }

  canTrigger(rule, targetId, now = Date.now()) {
    const key = this.key(rule.id, targetId);
    const last = this.#entries.get(key);
    if (!Number.isFinite(last)) return true;
    return now - last >= rule.cooldownMinutes * 60_000;
  }

  record(rule, targetId, now = Date.now()) {
    this.#entries.set(this.key(rule.id, targetId), now);
    this.prune(now);
  }

  prune(now = Date.now()) {
    const maximumAge = 14 * 24 * 60 * 60 * 1000;
    for (const [key, value] of this.#entries) if (now - value > maximumAge) this.#entries.delete(key);
  }

  snapshot() {
    return [...this.#entries.entries()].map(([key, timestamp]) => ({ key, timestamp, triggeredAt: new Date(timestamp).toISOString() }));
  }

  clear() { this.#entries.clear(); }
}
