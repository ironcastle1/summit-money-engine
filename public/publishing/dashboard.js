import { escapePublishing, publishingNumber } from './format.js';
export function renderPublishingDashboard(root, snapshot = {}) {
  const metrics = snapshot.diagnostics?.metrics || {};
  const cards = [
    ['PUBLICATIONS', metrics.publications || 0, `${metrics.activePublications || 0} active`],
    ['EDITIONS', metrics.editions || 0, `${metrics.publishedEditions || 0} published`],
    ['OPEN RATE', `${publishingNumber(metrics.openRate || 0)}%`, `${metrics.downloads || 0} downloads`],
    ['DELIVERY', `${publishingNumber(metrics.deliveryReliability ?? 100)}%`, `${metrics.deliveryJobs || 0} jobs`],
    ['SUBSCRIBERS', snapshot.subscribers?.length || 0, `${snapshot.audiences?.length || 0} audiences`],
    ['SECURE SHARES', snapshot.shares?.length || 0, `${metrics.shares || 0} events`]
  ];
  root.innerHTML = `<div class="publishing-scorecards">${cards.map(([label, value, note]) => `<article><span>${escapePublishing(label)}</span><strong>${escapePublishing(value)}</strong><small>${escapePublishing(note)}</small></article>`).join('')}</div>`;
}
