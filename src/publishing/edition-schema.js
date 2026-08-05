import { EDITION_STATES, DEFAULT_PUBLICATION_LIMITS } from './constants.js';
import { contentBlockRecord } from './content-block-schema.js';
import { makePublishingId } from './ids.js';
import { clean, frozen, unique } from './utilities.js';

export function editionRecord(input = {}) {
  const state = String(input.state || 'DRAFT').toUpperCase();
  if (!EDITION_STATES.includes(state)) throw new TypeError(`Unsupported edition state: ${state}`);
  const now = new Date().toISOString();
  const blocks = (input.blocks || []).slice(0, DEFAULT_PUBLICATION_LIMITS.blocksPerEdition).map(contentBlockRecord).sort((a, b) => a.order - b.order);
  return frozen({
    id: clean(input.id, 190) || makePublishingId('edition', input.title),
    publicationId: clean(input.publicationId, 190),
    editionNumber: Math.max(1, Number(input.editionNumber) || 1),
    title: clean(input.title || 'Untitled edition', 240),
    subtitle: clean(input.subtitle, 500),
    state,
    classification: String(input.classification || 'CLIENT').toUpperCase(),
    period: clean(input.period, 80),
    blocks: Object.freeze(blocks),
    sourceIds: unique(input.sourceIds || blocks.flatMap(block => block.sourceIds), 5000),
    approval: frozen({ ...(input.approval || {}) }),
    quality: frozen({ ...(input.quality || {}) }),
    scheduledFor: input.scheduledFor || null,
    publishedAt: input.publishedAt || null,
    createdAt: input.createdAt || now,
    updatedAt: now,
    metadata: frozen({ ...(input.metadata || {}) })
  });
}
