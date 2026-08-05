import { makePublishingId } from './ids.js';
import { clean, frozen } from './utilities.js';

export class PublicationAnalyticsStore {
  constructor(options = {}) {
    this.maximum = Math.max(100, Number(options.maximum) || 50000);
    this.events = new Map();
  }

  bucket(owner) {
    const key = String(owner || 'anonymous');
    if (!this.events.has(key)) this.events.set(key, []);
    return this.events.get(key);
  }

  async record(owner, input = {}) {
    const bucket = this.bucket(owner);
    const record = frozen({
      id: clean(input.id, 190) || makePublishingId('analytics', input.type),
      type: String(input.type || 'VIEWED').toUpperCase(),
      editionId: clean(input.editionId, 190),
      publicationId: clean(input.publicationId, 190),
      subscriberId: clean(input.subscriberId, 190),
      channel: String(input.channel || 'SECURE_LINK').toUpperCase(),
      metadata: frozen({ ...(input.metadata || {}) }),
      time: input.time || new Date().toISOString()
    });
    bucket.push(record);
    if (bucket.length > this.maximum) bucket.splice(0, bucket.length - this.maximum);
    return record;
  }

  async list(owner, filter = {}) {
    return this.bucket(owner).filter(item => (!filter.editionId || item.editionId === filter.editionId) && (!filter.publicationId || item.publicationId === filter.publicationId) && (!filter.type || item.type === String(filter.type).toUpperCase())).slice(-Math.max(1, Number(filter.limit) || 5000)).reverse();
  }

  async summary(owner, filter = {}) {
    const items = await this.list(owner, { ...filter, limit: 50000 });
    const count = type => items.filter(item => item.type === type).length;
    const delivered = count('DELIVERED');
    const opened = count('OPENED') + count('VIEWED');
    return frozen({ total: items.length, delivered, opened, downloaded: count('DOWNLOADED'), shared: count('SHARED'), bounced: count('BOUNCED'), openRate: delivered ? Math.round(opened / delivered * 1000) / 10 : 0 });
  }
}
