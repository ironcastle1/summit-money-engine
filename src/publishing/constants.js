export const PUBLICATION_STATES = Object.freeze(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']);
export const EDITION_STATES = Object.freeze(['DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'WITHDRAWN']);
export const CLASSIFICATIONS = Object.freeze(['PUBLIC', 'CLIENT', 'CONFIDENTIAL', 'RESTRICTED']);
export const DELIVERY_CHANNELS = Object.freeze(['IN_APP', 'WEBHOOK', 'EMAIL', 'SLACK', 'SECURE_LINK']);
export const CONTENT_BLOCK_TYPES = Object.freeze([
  'TITLE', 'EXECUTIVE_SUMMARY', 'KEY_FINDINGS', 'METRIC_GRID', 'EVENT_TABLE', 'MARKET_TABLE',
  'COUNTRY_TABLE', 'ROUTE_TABLE', 'MAP_SNAPSHOT', 'TIMELINE', 'SCENARIO', 'RECOMMENDATIONS',
  'EVIDENCE', 'SOURCES', 'TEXT', 'DIVIDER'
]);
export const DELIVERY_STATES = Object.freeze(['QUEUED', 'DELIVERING', 'DELIVERED', 'PARTIAL', 'FAILED', 'SUPPRESSED']);
export const ANALYTICS_EVENTS = Object.freeze(['DELIVERED', 'OPENED', 'VIEWED', 'DOWNLOADED', 'SHARED', 'EXPIRED', 'BOUNCED']);
export const DEFAULT_PUBLICATION_LIMITS = Object.freeze({
  publicationsPerOwner: 250,
  editionsPerOwner: 2500,
  subscribersPerOwner: 10000,
  audiencesPerOwner: 500,
  templatesPerOwner: 200,
  brandKitsPerOwner: 50,
  blocksPerEdition: 80,
  recipientsPerDelivery: 5000,
  shareLifetimeHours: 168,
  maximumArchiveItems: 10000
});
