import { contentBlockRecord } from './content-block-schema.js';
import { makePublishingId } from './ids.js';
import { clean, frozen, unique } from './utilities.js';

export function publicationTemplateRecord(input = {}) {
  const now = new Date().toISOString();
  return frozen({
    id: clean(input.id, 190) || makePublishingId('template', input.name),
    name: clean(input.name || 'Publication template', 180),
    description: clean(input.description, 1200),
    category: clean(input.category || 'INTELLIGENCE', 100).toUpperCase(),
    blocks: Object.freeze((input.blocks || []).map(contentBlockRecord)),
    requiredBlockTypes: unique(input.requiredBlockTypes || [], 40).map(value => String(value).toUpperCase()),
    defaultClassification: String(input.defaultClassification || 'CLIENT').toUpperCase(),
    formats: unique(input.formats || ['HTML', 'MARKDOWN', 'JSON'], 20).map(value => String(value).toUpperCase()),
    createdAt: input.createdAt || now,
    updatedAt: now
  });
}
