import { ValidationError } from '../core/errors.js';
import { allowedUserDataBucket } from '../repositories/user-data-repository.js';
const limits = { watchlists: 'watchlists', workspaces: 'workspaces', alerts: 'alertRules', savedSearches: 'savedSearches' };
export class UserDataService {
  constructor(options) { Object.assign(this, options); }
  validate(bucket, value) {
    if (!allowedUserDataBucket(bucket)) throw new ValidationError('User data bucket is invalid', { bucket });
    if (bucket === 'preferences' && (!value || typeof value !== 'object' || Array.isArray(value))) throw new ValidationError('Preferences must be an object');
    if (bucket !== 'preferences' && !Array.isArray(value)) throw new ValidationError(`${bucket} must be an array`);
    const bytes = Buffer.byteLength(JSON.stringify(value));
    if (bytes > 1_000_000) throw new ValidationError('User data exceeds 1 MB', { bucket, bytes });
  }
  async get(user, bucket) { return this.repository.get(user.id, bucket); }
  async put(user, bucket, value) {
    this.validate(bucket, value);
    const limitKey = limits[bucket];
    if (limitKey) { const entitlements = await this.entitlements.forUser(user); const limit = entitlements.limits[limitKey]; if (value.length > limit) throw new ValidationError('Plan item limit exceeded', { bucket, limit, count: value.length }); }
    return this.repository.put(user.id, bucket, value);
  }
}
