import { CLASSIFICATIONS, PUBLICATION_STATES } from './constants.js';
import { makePublishingId } from './ids.js';
import { clean, frozen, unique } from './utilities.js';

export function publicationRecord(input = {}) {
  const state = String(input.state || 'DRAFT').toUpperCase();
  const classification = String(input.classification || 'CLIENT').toUpperCase();
  if (!PUBLICATION_STATES.includes(state)) throw new TypeError(`Unsupported publication state: ${state}`);
  if (!CLASSIFICATIONS.includes(classification)) throw new TypeError(`Unsupported classification: ${classification}`);
  const now = new Date().toISOString();
  return frozen({
    id: clean(input.id, 190) || makePublishingId('publication', input.name),
    name: clean(input.name || 'Untitled publication', 180),
    description: clean(input.description, 2000),
    state,
    classification,
    cadence: String(input.cadence || 'AD_HOC').toUpperCase(),
    templateId: clean(input.templateId, 190),
    brandKitId: clean(input.brandKitId, 190),
    audienceIds: unique(input.audienceIds || [], 100),
    ownerTeam: clean(input.ownerTeam || 'Intelligence', 160),
    tags: unique(input.tags || [], 100),
    approvalRequired: input.approvalRequired !== false,
    schedule: frozen({ ...(input.schedule || {}) }),
    createdAt: input.createdAt || now,
    updatedAt: now
  });
}
