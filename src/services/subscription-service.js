import { randomUUID } from 'node:crypto';
import { ConflictError, NotFoundError, ValidationError } from '../core/errors.js';
import { getPlan, PLAN_IDS, publicPlan } from '../domain/accounts/plans.js';
import { normalizeSubscriptionState } from '../domain/accounts/subscription-state.js';

export class SubscriptionService {
  constructor(options) { Object.assign(this, options); }
  plans() { return PLAN_IDS.map(id => publicPlan(getPlan(id))); }
  async current(user) { const subscription = await this.repository.findByUserId(user.id); return { subscription, entitlements: await this.entitlements.forUser(user), providers: this.providers.health() }; }
  async createCheckout(user, input) {
    const planId = String(input.planId || '').toUpperCase();
    if (!PLAN_IDS.includes(planId) || planId === 'FREE') throw new ValidationError('Paid plan is invalid', { planId });
    const provider = this.providers.get(input.provider);
    if (!provider.configured) throw new ConflictError('Billing provider is not configured', { provider: provider.id });
    const plan = getPlan(planId);
    const result = await provider.createCheckout({ userId: user.id, email: user.email, planId, amount: plan.amountMinor / 100, interval: plan.interval, successUrl: input.successUrl, cancelUrl: input.cancelUrl, idempotencyKey: randomUUID() });
    await this.repository.upsert({ id: randomUUID(), userId: user.id, planId, state: 'NONE', provider: provider.id, providerCheckoutId: result.checkoutId, providerCustomerId: null, providerSubscriptionId: null, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    await this.audit.record({ actorUserId: user.id, actorRole: user.role, action: 'CHECKOUT_CREATED', targetType: 'SUBSCRIPTION', targetId: result.checkoutId, metadata: { provider: provider.id, planId } });
    return result;
  }
  async applyProviderEvent(providerId, mapped, rawEvent) {
    if (!mapped?.eventId) throw new ValidationError('Billing event does not contain an event ID');
    if (!(await this.webhooks.record({ provider: providerId, eventId: mapped.eventId, type: mapped.type, receivedAt: new Date().toISOString() }))) return { duplicate: true };
    let userId = mapped.userId;
    if (!userId) { const existing = await this.repository.findByProviderReference(providerId, mapped.providerSubscriptionId || mapped.providerCheckoutId); userId = existing?.userId || null; }
    if (!userId) throw new NotFoundError('Billing event cannot be matched to a user', { provider: providerId, eventId: mapped.eventId });
    const existing = await this.repository.findByUserId(userId);
    const planId = mapped.planId || existing?.planId || 'FREE';
    const state = normalizeSubscriptionState(mapped.state);
    const now = new Date();
    const currentPeriodEnd = mapped.currentPeriodEnd || (mapped.oneTime && state === 'ACTIVE' ? new Date(now.getTime() + 31 * 86400000).toISOString() : existing?.currentPeriodEnd || null);
    const subscription = await this.repository.upsert({ ...(existing || { id: randomUUID(), userId, createdAt: now.toISOString() }), userId, planId, state, provider: providerId, providerCustomerId: mapped.providerCustomerId || existing?.providerCustomerId || null, providerSubscriptionId: mapped.providerSubscriptionId || existing?.providerSubscriptionId || null, providerCheckoutId: mapped.providerCheckoutId || existing?.providerCheckoutId || null, currentPeriodStart: state === 'ACTIVE' && !existing?.currentPeriodStart ? now.toISOString() : existing?.currentPeriodStart || null, currentPeriodEnd, updatedAt: now.toISOString(), lastEventId: mapped.eventId, lastEventType: mapped.type });
    await this.audit.record({ actorUserId: userId, action: 'SUBSCRIPTION_UPDATED', targetType: 'SUBSCRIPTION', targetId: subscription.id, metadata: { provider: providerId, planId, state, eventType: mapped.type } });
    return { duplicate: false, subscription };
  }
  async grant(actor, userId, input) {
    const user = await this.accounts.findById(userId); if (!user) throw new NotFoundError('User not found', { userId });
    const planId = String(input.planId || '').toUpperCase(); if (!PLAN_IDS.includes(planId)) throw new ValidationError('Plan is invalid');
    const days = Math.max(1, Math.min(3650, Number(input.days || 30)));
    const existing = await this.repository.findByUserId(userId);
    const now = new Date();
    const subscription = await this.repository.upsert({ ...(existing || { id: randomUUID(), userId, createdAt: now.toISOString() }), planId, state: planId === 'FREE' ? 'NONE' : 'ACTIVE', provider: 'manual', currentPeriodStart: now.toISOString(), currentPeriodEnd: planId === 'FREE' ? null : new Date(now.getTime() + days * 86400000).toISOString(), updatedAt: now.toISOString() });
    await this.audit.record({ actorUserId: actor.id, actorRole: actor.role, action: 'SUBSCRIPTION_GRANTED', targetType: 'USER', targetId: userId, metadata: { planId, days } });
    return subscription;
  }
}
