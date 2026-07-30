export class WebhookRepository {
  constructor(store) { this.store = store; }
  async has(provider, eventId) { return (await this.store.read()).webhooks.some(item => item.provider === provider && item.eventId === eventId); }
  async record(entry) { return this.store.update(doc => { if (doc.webhooks.some(item => item.provider === entry.provider && item.eventId === entry.eventId)) return false; doc.webhooks.push(entry); if (doc.webhooks.length > 10_000) doc.webhooks.splice(0, doc.webhooks.length - 10_000); return true; }); }
}
