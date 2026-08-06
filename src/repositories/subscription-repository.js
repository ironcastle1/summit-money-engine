export class SubscriptionRepository {
  constructor(store) { this.store = store; }
  async list() { return [...(await this.store.read()).subscriptions]; }
  async findByUserId(userId) { return (await this.list()).find(item => item.userId === userId) || null; }
  async findByProviderReference(provider, reference) { return (await this.list()).find(item => item.provider === provider && [item.providerCustomerId, item.providerSubscriptionId, item.providerCheckoutId].includes(reference)) || null; }
  async upsert(subscription) {
    return this.store.update(doc => {
      const index = doc.subscriptions.findIndex(item => item.userId === subscription.userId);
      if (index < 0) doc.subscriptions.push(subscription);
      else doc.subscriptions[index] = { ...doc.subscriptions[index], ...subscription, updatedAt: new Date().toISOString() };
      return index < 0 ? subscription : doc.subscriptions[index];
    });
  }
}
