import { OwnerCommercialStore } from './generic-store.js';
import { featureFlagRecord } from './feature-flag-schema.js';
export class FeatureFlagStore extends OwnerCommercialStore {
    async put(owner, input) { const current = input.id ? await this.get(owner, input.id) : null; return super.put(owner, featureFlagRecord({ ...current, ...input })); }
}
