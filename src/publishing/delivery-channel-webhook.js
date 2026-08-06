import { frozen } from './utilities.js';

export function createPublicationWebhookChannel(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const timeoutMs = Math.max(500, Number(options.timeoutMs) || 8000);
  return frozen({
    id: 'WEBHOOK',
    available: typeof fetchImpl === 'function',
    async deliver(message) {
      const url = message.recipient.webhookUrl;
      if (!url) return frozen({ channel: 'WEBHOOK', state: 'SUPPRESSED', recipientId: message.recipient.id, reason: 'WEBHOOK_NOT_CONFIGURED' });
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(message.payload), signal: controller.signal });
        if (!response.ok) return frozen({ channel: 'WEBHOOK', state: 'FAILED', recipientId: message.recipient.id, status: response.status });
        return frozen({ channel: 'WEBHOOK', state: 'DELIVERED', recipientId: message.recipient.id, status: response.status, deliveredAt: new Date().toISOString() });
      } catch (error) {
        return frozen({ channel: 'WEBHOOK', state: 'FAILED', recipientId: message.recipient.id, reason: error.name === 'AbortError' ? 'TIMEOUT' : error.message });
      } finally {
        clearTimeout(timer);
      }
    }
  });
}
