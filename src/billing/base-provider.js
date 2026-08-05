import { ConfigurationError } from '../core/errors.js';
import { providerHealth } from './provider-status.js';

export class BaseBillingProvider {
  constructor(options) { this.id = options.id; this.configured = Boolean(options.configured); this.logger = options.logger; }
  health() { return providerHealth(this.id, this.configured); }
  assertConfigured() { if (!this.configured) throw new ConfigurationError(`${this.id} billing is not configured`); }
  async createCheckout() { throw new Error('createCheckout not implemented'); }
  async verifyWebhook() { throw new Error('verifyWebhook not implemented'); }
  mapWebhook() { return null; }
}
