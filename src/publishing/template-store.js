import { OwnerRecordStore } from './generic-store.js';
import { publicationTemplateRecord } from './template-schema.js';

export class TemplateStore extends OwnerRecordStore {
  constructor(options = {}) { super({ maximum: options.maximum || 200 }); }
  async put(owner, input) { return super.put(owner, publicationTemplateRecord(input)); }
}
