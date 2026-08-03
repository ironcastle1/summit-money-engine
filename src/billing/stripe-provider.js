import { BaseBillingProvider } from './base-provider.js';
import { verifyStripeSignature } from '../security/webhook-signatures.js';
import { UpstreamError } from '../core/errors.js';

function formBody(values) { const params = new URLSearchParams(); for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== null && value !== '') params.set(key, String(value)); return params.toString(); }

export class StripeProvider extends BaseBillingProvider {
  constructor(options) { super({ ...options, id: 'stripe', configured: options.secretKey && options.webhookSecret }); this.secretKey = options.secretKey; this.webhookSecret = options.webhookSecret; this.priceIds = options.priceIds || {}; this.baseUrl = options.baseUrl; }
  health() { return { ...super.health(), supportedPlans: Object.keys(this.priceIds).filter(key => this.priceIds[key]) }; }
  async createCheckout(input) {
    this.assertConfigured();
    const price = this.priceIds[input.planId];
    if (!price) throw new UpstreamError('Stripe price is not configured', { upstream: 'stripe', statusCode: 503, details: { planId: input.planId } });
    const response = await fetch(`${this.baseUrl}/v1/checkout/sessions`, {
      method: 'POST',
      headers: { authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: formBody({ mode: 'subscription', 'line_items[0][price]': price, 'line_items[0][quantity]': 1, success_url: input.successUrl, cancel_url: input.cancelUrl, client_reference_id: input.userId, customer_email: input.email, 'metadata[userId]': input.userId, 'metadata[planId]': input.planId })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new UpstreamError('Stripe checkout creation failed', { upstream: 'stripe', details: { status: response.status, message: body?.error?.message } });
    return { provider: this.id, checkoutId: body.id, url: body.url, expiresAt: body.expires_at ? new Date(body.expires_at * 1000).toISOString() : null };
  }
  async verifyWebhook(rawBody, headers) { this.assertConfigured(); return verifyStripeSignature(rawBody, headers['stripe-signature'], this.webhookSecret); }
  mapWebhook(event) {
    const object = event?.data?.object || {};
    const type = String(event?.type || '');
    const userId = object.metadata?.userId || object.client_reference_id || object.subscription_details?.metadata?.userId || null;
    const planId = object.metadata?.planId || object.subscription_details?.metadata?.planId || null;
    const statusMap = { trialing: 'TRIALING', active: 'ACTIVE', past_due: 'PAST_DUE', unpaid: 'PAST_DUE', paused: 'PAUSED', canceled: 'CANCELLED', incomplete: 'NONE', incomplete_expired: 'EXPIRED' };
    const stateMap = { 'checkout.session.completed': 'ACTIVE', 'customer.subscription.created': statusMap[object.status] || 'NONE', 'customer.subscription.updated': statusMap[object.status] || 'NONE', 'customer.subscription.deleted': 'CANCELLED', 'invoice.payment_failed': 'PAST_DUE', 'invoice.paid': 'ACTIVE' };
    if (!stateMap[type]) return null;
    return { eventId: event.id, type, userId, planId, state: stateMap[type], providerCustomerId: object.customer || null, providerSubscriptionId: object.subscription || object.id || null, currentPeriodEnd: object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : null };
  }
}
