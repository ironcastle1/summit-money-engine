import { contentFingerprint } from './ids.js';
import { frozen } from './utilities.js';

export class PublicationArchiveStore {
  constructor(options = {}) {
    this.maximum = Math.max(100, Number(options.maximum) || 10000);
    this.archives = new Map();
  }

  bucket(owner) {
    const key = String(owner || 'anonymous');
    if (!this.archives.has(key)) this.archives.set(key, []);
    return this.archives.get(key);
  }

  async archive(owner, resourceType, resource) {
    const bucket = this.bucket(owner);
    const record = frozen({ resourceType: String(resourceType).toUpperCase(), resourceId: resource.id, versionHash: contentFingerprint(resource), archivedAt: new Date().toISOString(), resource });
    bucket.push(record);
    if (bucket.length > this.maximum) bucket.splice(0, bucket.length - this.maximum);
    return record;
  }

  async list(owner, filter = {}) {
    return this.bucket(owner).filter(item => !filter.resourceType || item.resourceType === String(filter.resourceType).toUpperCase()).slice(-Math.max(1, Number(filter.limit) || 500)).reverse();
  }
}
