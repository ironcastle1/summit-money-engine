import { incrementUsage, normalizeUsage, usageCounters } from '../domain/accounts/usage.js';
export class UsageRepository {
  constructor(store) { this.store = store; }
  async get(userId) { const doc = await this.store.read(); return usageCounters(doc.usage?.[userId]); }
  async increment(userId, key, amount = 1) { return this.store.update(doc => { doc.usage ||= {}; doc.usage[userId] = incrementUsage(doc.usage[userId], key, amount); return normalizeUsage(doc.usage[userId]); }); }
}
