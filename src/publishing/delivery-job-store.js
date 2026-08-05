import { OwnerRecordStore } from './generic-store.js';
import { makePublishingId } from './ids.js';
import { clean, frozen } from './utilities.js';

export class DeliveryJobStore extends OwnerRecordStore {
  constructor(options = {}) { super({ maximum: options.maximum || 10000 }); }

  async create(owner, input = {}) {
    const now = new Date().toISOString();
    return this.put(owner, frozen({
      id: clean(input.id, 190) || makePublishingId('delivery', input.editionId),
      editionId: clean(input.editionId, 190),
      publicationId: clean(input.publicationId, 190),
      state: String(input.state || 'QUEUED').toUpperCase(),
      recipients: Object.freeze([...(input.recipients || [])]),
      channels: Object.freeze([...(input.channels || ['IN_APP'])]),
      results: Object.freeze([...(input.results || [])]),
      scheduledFor: input.scheduledFor || null,
      createdAt: input.createdAt || now,
      updatedAt: now
    }));
  }

  async transition(owner, id, state, changes = {}) {
    const item = await this.get(owner, id);
    if (!item) return null;
    return this.put(owner, frozen({ ...item, ...changes, state: String(state).toUpperCase(), updatedAt: new Date().toISOString() }));
  }
}
