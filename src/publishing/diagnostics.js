import { publicationMetrics } from './publication-metrics.js';
import { frozen } from './utilities.js';

export async function publishingDiagnostics(platform, owner) {
  const [publications, editions, deliveries, subscribers, audiences, templates, brands, analytics, shares] = await Promise.all([
    platform.publications.list(owner, { limit: 10000 }),
    platform.editions.list(owner, { limit: 10000 }),
    platform.deliveries.list(owner, { limit: 10000 }),
    platform.subscribers.list(owner, { limit: 10000 }),
    platform.audiences.list(owner, { limit: 10000 }),
    platform.templates.list(owner, { limit: 10000 }),
    platform.brandKits.list(owner, { limit: 10000 }),
    platform.analytics.summary(owner),
    platform.listShares(owner)
  ]);
  return frozen({
    status: 'READY',
    platform: 'MERLIN_PUBLISHING',
    metrics: publicationMetrics({ publications, editions, deliveries, analytics }),
    records: { subscribers: subscribers.length, audiences: audiences.length, templates: templates.length, brandKits: brands.length, secureShares: shares.length },
    channels: platform.deliveryRouter.status(),
    scheduler: { installed: Boolean(platform.scheduler) },
    generatedAt: new Date().toISOString()
  });
}
