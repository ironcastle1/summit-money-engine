import { OwnerCommercialStore } from './generic-store.js';
import { feedbackRecord } from './feedback-schema.js';
export class FeedbackStore extends OwnerCommercialStore {
    async put(owner, input) { const current = input.id ? await this.get(owner, input.id) : null; return super.put(owner, feedbackRecord({ ...current, ...input })); }
}
