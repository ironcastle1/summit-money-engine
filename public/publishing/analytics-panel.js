import { escapePublishing, publishingNumber } from './format.js';
export function renderAnalyticsPanel(root, snapshot = {}) {
  const analytics = snapshot.analytics || {};
  root.innerHTML = `<section class="publishing-panel"><header><h2>READER ANALYTICS</h2></header><div class="analytics-grid">${[['DELIVERED', analytics.delivered || 0], ['OPENED / VIEWED', analytics.opened || 0], ['OPEN RATE', `${publishingNumber(analytics.openRate || 0)}%`], ['DOWNLOADED', analytics.downloaded || 0], ['SHARED', analytics.shared || 0], ['BOUNCED', analytics.bounced || 0]].map(([label, value]) => `<article><span>${escapePublishing(label)}</span><strong>${escapePublishing(value)}</strong></article>`).join('')}</div></section>`;
}
