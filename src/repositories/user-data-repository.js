const ALLOWED_BUCKETS = new Set(['watchlists', 'workspaces', 'alerts', 'savedSearches', 'preferences']);
export function allowedUserDataBucket(bucket) { return ALLOWED_BUCKETS.has(String(bucket)); }

export class UserDataRepository {
  constructor(store) { this.store = store; }
  async get(userId, bucket) { const doc = await this.store.read(); return structuredClone(doc.userData?.[userId]?.[bucket] ?? (bucket === 'preferences' ? {} : [])); }
  async put(userId, bucket, value) {
    return this.store.update(doc => {
      doc.userData ||= {}; doc.userData[userId] ||= {};
      doc.userData[userId][bucket] = structuredClone(value);
      doc.userData[userId].updatedAt = new Date().toISOString();
      return doc.userData[userId][bucket];
    });
  }
  async removeUser(userId) { return this.store.update(doc => { const existed = Boolean(doc.userData?.[userId]); if (doc.userData) delete doc.userData[userId]; return existed; }); }
}
