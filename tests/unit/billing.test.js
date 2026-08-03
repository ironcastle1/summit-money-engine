import test from 'node:test';
import assert from 'node:assert/strict';
import { StripeProvider } from '../../src/billing/stripe-provider.js';
import { PayPalProvider } from '../../src/billing/paypal-provider.js';
import { CoinbaseProvider } from '../../src/billing/coinbase-provider.js';
import { BillingProviderRegistry } from '../../src/billing/provider-registry.js';

test('billing registry exposes explicit NOT_CONFIGURED states', () => {
  const registry = new BillingProviderRegistry()
    .register(new StripeProvider({ secretKey: '', webhookSecret: '', priceIds: {}, baseUrl: 'https://api.stripe.com' }))
    .register(new PayPalProvider({ clientId: '', clientSecret: '', webhookId: '', planIds: {}, baseUrl: 'https://api-m.paypal.com' }))
    .register(new CoinbaseProvider({ bearerToken: '', webhookSecret: '', baseUrl: 'https://business.coinbase.com' }));
  const health = registry.health();
  assert.equal(health.stripe.state, 'NOT_CONFIGURED');
  assert.equal(health.paypal.state, 'NOT_CONFIGURED');
  assert.equal(health.coinbase.state, 'NOT_CONFIGURED');
});

test('Stripe event mapping normalizes provider state spelling', () => {
  const provider = new StripeProvider({ secretKey: 'sk_test', webhookSecret: 'whsec_test', priceIds: { PRO: 'price_1' }, baseUrl: 'https://api.stripe.com' });
  const mapped = provider.mapWebhook({ id: 'evt_1', type: 'customer.subscription.updated', data: { object: { id: 'sub_1', status: 'canceled', metadata: { userId: 'u1', planId: 'PRO' } } } });
  assert.equal(mapped.state, 'CANCELLED');
  assert.equal(mapped.userId, 'u1');
});

test('PayPal and Coinbase events preserve explicit user metadata', () => {
  const paypal = new PayPalProvider({ clientId: 'id', clientSecret: 'secret', webhookId: 'hook', planIds: { PRO: 'P-1' }, baseUrl: 'https://api-m.sandbox.paypal.com' });
  const payPalMapped = paypal.mapWebhook({ id: 'wh_1', event_type: 'BILLING.SUBSCRIPTION.ACTIVATED', resource: { id: 'sub_1', custom_id: 'u1', status: 'ACTIVE' } });
  assert.equal(payPalMapped.state, 'ACTIVE');
  assert.equal(payPalMapped.userId, 'u1');
  const coinbase = new CoinbaseProvider({ bearerToken: 'token', webhookSecret: 'secret', baseUrl: 'https://business.coinbase.com' });
  const coinbaseMapped = coinbase.mapWebhook({ id: 'wh_2', type: 'checkout.completed', data: { id: 'co_1', status: 'COMPLETED', metadata: { userId: 'u2', planId: 'PRO' } } });
  assert.equal(coinbaseMapped.state, 'ACTIVE');
  assert.equal(coinbaseMapped.oneTime, true);
});
