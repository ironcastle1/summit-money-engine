import { makePublishingId } from './ids.js';
import { clean, frozen, unique } from './utilities.js';

export function audienceRecord(input = {}) {
  const now = new Date().toISOString();
  return frozen({
    id: clean(input.id, 190) || makePublishingId('audience', input.name),
    name: clean(input.name || 'Audience', 180),
    description: clean(input.description, 1000),
    subscriberIds: unique(input.subscriberIds || [], 10000),
    filters: frozen({ ...(input.filters || {}) }),
    defaultChannels: unique(input.defaultChannels || ['IN_APP'], 10).map(value => String(value).toUpperCase()),
    classificationCeiling: String(input.classificationCeiling || 'CLIENT').toUpperCase(),
    active: input.active !== false,
    createdAt: input.createdAt || now,
    updatedAt: now
  });
}
