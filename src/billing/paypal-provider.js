import { BaseBillingProvider } from './base-provider.js';
import { UpstreamError } from '../core/errors.js';

export class PayPalProvider extends BaseBillingProvider {
  constructor(options) { super({ ...options, id: 'paypal', configured: options.clientId && options.clientSecret && options.webhookId }); this.clientId = options.clientId; this.clientSecret = options.clientSecret; this.webhookId = options.webhookId; this.planIds = options.planIds || {}; this.baseUrl = options.baseUrl; }
  health() { return { ...super.health(), supportedPlans: Object.keys(this.planIds).filter(key => this.planIds[key]), environment: this.baseUrl.includes('sandbox') ? 'sandbox' : 'live' }; }
  async accessToken() {
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, { method: 'POST', headers: { authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.access_token) throw new UpstreamError('PayPal authentication failed', { upstream: 'paypal', details: { status: response.status } });
    return body.access_token;
  }
  async createCheckout(input) {
    this.assertConfigured();
    const planId = this.planIds[input.planId];
    if (!planId) throw new UpstreamError('PayPal plan is not configured', { upstream: 'paypal', statusCode: 503, details: { planId: input.planId } });
    const token = await this.accessToken();
    const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'paypal-request-id': input.idempotencyKey }, body: JSON.stringify({ plan_id: planId, custom_id: input.userId, subscriber: { email_address: input.email }, application_context: { brand_name: 'Merlin', user_action: 'SUBSCRIBE_NOW', return_url: input.successUrl, cancel_url: input.cancelUrl } }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new UpstreamError('PayPal subscription creation failed', { upstream: 'paypal', details: { status: response.status, message: body.message } });
    const approve = body.links?.find(link => link.rel === 'approve')?.href || null;
    return { provider: this.id, checkoutId: body.id, url: approve, expiresAt: null };
  }
  async verifyWebhook(rawBody, headers) {
    this.assertConfigured();
    const token = await this.accessToken();
    const event = JSON.parse(rawBody);
    const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ auth_algo: headers['paypal-auth-algo'], cert_url: headers['paypal-cert-url'], transmission_id: headers['paypal-transmission-id'], transmission_sig: headers['paypal-transmission-sig'], transmission_time: headers['paypal-transmission-time'], webhook_id: this.webhookId, webhook_event: event }) });
    const result = await response.json().catch(() => ({}));
    return response.ok && result.verification_status === 'SUCCESS';
  }
  mapWebhook(event) {
    const resource = event?.resource || {};
    const type = String(event?.event_type || '');
    const stateMap = { 'BILLING.SUBSCRIPTION.ACTIVATED': 'ACTIVE', 'BILLING.SUBSCRIPTION.CREATED': 'NONE', 'BILLING.SUBSCRIPTION.UPDATED': ({ ACTIVE: 'ACTIVE', SUSPENDED: 'PAUSED', CANCELLED: 'CANCELLED', EXPIRED: 'EXPIRED', APPROVAL_PENDING: 'NONE' }[String(resource.status || '').toUpperCase()] || 'NONE'), 'BILLING.SUBSCRIPTION.SUSPENDED': 'PAUSED', 'BILLING.SUBSCRIPTION.CANCELLED': 'CANCELLED', 'BILLING.SUBSCRIPTION.EXPIRED': 'EXPIRED', 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': 'PAST_DUE' };
    if (!stateMap[type]) return null;
    return { eventId: event.id, type, userId: resource.custom_id || null, planId: null, state: stateMap[type], providerCustomerId: resource.subscriber?.payer_id || null, providerSubscriptionId: resource.id || null, currentPeriodEnd: resource.billing_info?.next_billing_time || null };
  }
}
