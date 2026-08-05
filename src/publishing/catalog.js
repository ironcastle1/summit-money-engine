import { CLASSIFICATIONS, CONTENT_BLOCK_TYPES, DELIVERY_CHANNELS, EDITION_STATES, PUBLICATION_STATES } from './constants.js';
import { frozen } from './utilities.js';

export function publishingCatalog() {
  return frozen({
    platform: 'MERLIN_PUBLISHING',
    version: '20.14.0',
    publicationStates: PUBLICATION_STATES,
    editionStates: EDITION_STATES,
    classifications: CLASSIFICATIONS,
    blockTypes: CONTENT_BLOCK_TYPES,
    deliveryChannels: DELIVERY_CHANNELS,
    formats: ['HTML', 'MARKDOWN', 'JSON', 'CSV', 'PRINT_HTML'],
    capabilities: [
      'publication-series', 'edition-composition', 'brand-kits', 'templates', 'audiences', 'subscribers',
      'approval-gates', 'quality-gates', 'secure-sharing', 'watermarks', 'redaction', 'scheduled-editions',
      'in-app-delivery', 'webhook-delivery', 'analytics', 'archive', 'client-ready-exports'
    ]
  });
}
