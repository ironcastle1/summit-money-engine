import { clamp, frozen } from './utilities.js';

export function publicationMetrics(input = {}) {
  const publications = input.publications || [];
  const editions = input.editions || [];
  const deliveries = input.deliveries || [];
  const analytics = input.analytics || {};
  const published = editions.filter(item => item.state === 'PUBLISHED').length;
  const failedDeliveries = deliveries.filter(item => ['FAILED', 'PARTIAL'].includes(item.state)).length;
  return frozen({
    publications: publications.length,
    activePublications: publications.filter(item => item.state === 'ACTIVE').length,
    editions: editions.length,
    publishedEditions: published,
    scheduledEditions: editions.filter(item => item.state === 'SCHEDULED').length,
    deliveryJobs: deliveries.length,
    deliveryReliability: deliveries.length ? clamp((deliveries.length - failedDeliveries) / deliveries.length * 100) : 100,
    openRate: Number(analytics.openRate || 0),
    downloads: Number(analytics.downloaded || 0),
    shares: Number(analytics.shared || 0)
  });
}
