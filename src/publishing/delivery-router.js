import { frozen, unique } from './utilities.js';

export class PublicationDeliveryRouter {
  constructor(options = {}) {
    this.channels = new Map((options.channels || []).map(channel => [channel.id, channel]));
  }

  register(channel) {
    this.channels.set(channel.id, channel);
    return this;
  }

  status() {
    return frozen(Object.fromEntries(['IN_APP', 'WEBHOOK', 'EMAIL', 'SLACK', 'SECURE_LINK'].map(id => [id, this.channels.has(id) ? { state: this.channels.get(id).available === false ? 'NOT_CONFIGURED' : 'AVAILABLE' } : { state: ['EMAIL', 'SLACK'].includes(id) ? 'NOT_CONFIGURED' : 'UNAVAILABLE' }])));
  }

  async deliver(message, channelIds = []) {
    const results = [];
    for (const id of unique(channelIds, 10).map(value => String(value).toUpperCase())) {
      if (id === 'SECURE_LINK') {
        results.push(frozen({ channel: id, state: message.shareUrl ? 'DELIVERED' : 'SUPPRESSED', recipientId: message.recipient.id, reason: message.shareUrl ? null : 'SHARE_LINK_NOT_CREATED' }));
        continue;
      }
      const channel = this.channels.get(id);
      if (!channel) {
        results.push(frozen({ channel: id, state: 'SUPPRESSED', recipientId: message.recipient.id, reason: 'CHANNEL_NOT_CONFIGURED' }));
        continue;
      }
      results.push(await channel.deliver(message));
    }
    return frozen(results);
  }
}
