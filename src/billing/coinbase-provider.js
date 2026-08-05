import { BaseBillingProvider } from './base-provider.js';
import { verifyCoinbaseSignature } from '../security/webhook-signatures.js';
import { UpstreamError } from '../core/errors.js';
import { createCdpJwt } from '../security/cdp-jwt.js';

export class CoinbaseProvider extends BaseBillingProvider {
  constructor(options) { super({ ...options, id: 'coinbase', configured: (options.bearerToken || (options.keyId && options.keySecret)) && options.webhookSecret }); this.bearerToken = options.bearerToken; this.keyId = options.keyId; this.keySecret = options.keySecret; this.webhookSecret = options.webhookSecret; this.baseUrl = options.baseUrl; this.currency = options.currency || 'USDC'; this.network = options.network || 'base'; }
  health() { return { ...super.health(), mode: 'one-time', currency: this.currency, network: this.network }; }
  token(method, path) { if (this.bearerToken) return this.bearerToken; const host = new URL(this.baseUrl).host; return createCdpJwt({ keyId: this.keyId, keySecret: this.keySecret, method, host, path }); }
  async createCheckout(input) {
    this.assertConfigured();
    const path = '/api/v1/checkouts';
    const response = await fetch(`${this.baseUrl}${path}`, { method: 'POST', headers: { authorization: `Bearer ${this.token('POST', path)}`, 'content-type': 'application/json', 'x-idempotency-key': input.idempotencyKey }, body: JSON.stringify({ amount: input.amount.toFixed(2), currency: this.currency, network: this.network, description: `Merlin ${input.planId} access`, successRedirectUrl: input.successUrl, failRedirectUrl: input.cancelUrl, expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), metadata: { userId: input.userId, planId: input.planId, billingInterval: input.interval } }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new UpstreamError('Coinbase checkout creation failed', { upstream: 'coinbase', details: { status: response.status, message: body.message } });
    return { provider: this.id, checkoutId: body.id, url: body.url, expiresAt: body.expiresAt || null };
  }
  async verifyWebhook(rawBody, headers) { this.assertConfigured(); return verifyCoinbaseSignature(rawBody, headers['x-hook0-signature'], this.webhookSecret, headers); }
  mapWebhook(event) {
    const data = event?.data || event;
    const status = String(data.status || event?.type || '').toUpperCase();
    if (!/(COMPLETED|CONFIRMED|FAILED|EXPIRED|CHECKOUT)/.test(status)) return null;
    const paid = status.includes('COMPLETED') || status.includes('CONFIRMED');
    return { eventId: event.id || event.eventId || data.id, type: event.type || status, userId: data.metadata?.userId || null, planId: data.metadata?.planId || null, state: paid ? 'ACTIVE' : status.includes('FAILED') ? 'PAST_DUE' : 'EXPIRED', providerCheckoutId: data.id || null, oneTime: true };
  }
}
