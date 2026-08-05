import { frozen } from './utilities.js';

export function createInAppPublicationChannel(options = {}) {
  const notifications = options.notifications;
  return frozen({
    id: 'IN_APP',
    available: true,
    async deliver(message) {
      if (notifications?.put) await notifications.put(message.owner, { title: message.subject, body: message.summary, severity: message.severity || 'INFO', metadata: { editionId: message.editionId, shareUrl: message.shareUrl } });
      return frozen({ channel: 'IN_APP', state: 'DELIVERED', recipientId: message.recipient.id, deliveredAt: new Date().toISOString() });
    }
  });
}
