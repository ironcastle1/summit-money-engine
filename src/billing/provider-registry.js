import { NotFoundError } from '../core/errors.js';
export class BillingProviderRegistry {
  #providers = new Map();
  register(provider) { this.#providers.set(provider.id, provider); return this; }
  get(id) { const provider = this.#providers.get(String(id || '').toLowerCase()); if (!provider) throw new NotFoundError('Billing provider not found', { provider: id }); return provider; }
  health() { return Object.fromEntries([...this.#providers].map(([id, provider]) => [id, provider.health()])); }
  listReady() { return [...this.#providers.values()].filter(provider => provider.configured); }
}
