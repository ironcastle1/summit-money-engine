const VALID_TYPES = new Set(['WEB_VITAL', 'ERROR', 'CONNECTIVITY', 'INSTALL', 'NAVIGATION']);

function sanitizeText(value, maximum = 500) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maximum);
}

export class ClientReportStore {
  constructor(options = {}) {
    this.maximum = options.maximum || 1000;
    this.items = [];
  }

  add(input = {}, context = {}) {
    const type = String(input.type || '').toUpperCase();
    if (!VALID_TYPES.has(type)) throw new TypeError('Unsupported client report type');
    const report = {
      id: crypto.randomUUID(),
      type,
      name: sanitizeText(input.name, 80),
      value: Number.isFinite(Number(input.value)) ? Number(input.value) : null,
      rating: ['GOOD', 'NEEDS_IMPROVEMENT', 'POOR', 'N/A'].includes(String(input.rating || '').toUpperCase()) ? String(input.rating).toUpperCase() : 'N/A',
      route: sanitizeText(input.route, 160),
      message: sanitizeText(input.message, 500),
      stack: sanitizeText(input.stack, 2000),
      online: typeof input.online === 'boolean' ? input.online : null,
      effectiveType: sanitizeText(input.effectiveType, 40),
      clientVersion: sanitizeText(input.clientVersion, 80),
      userAgent: sanitizeText(context.userAgent, 300),
      ipHash: sanitizeText(context.ipHash, 128),
      recordedAt: new Date().toISOString()
    };
    this.items.push(report);
    if (this.items.length > this.maximum) this.items.splice(0, this.items.length - this.maximum);
    return report;
  }

  summary(options = {}) {
    const sinceMs = options.sinceMs || 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - sinceMs;
    const recent = this.items.filter(item => Date.parse(item.recordedAt) >= cutoff);
    const byType = {};
    const vitals = {};
    for (const item of recent) {
      byType[item.type] = (byType[item.type] || 0) + 1;
      if (item.type === 'WEB_VITAL' && item.name) {
        const bucket = vitals[item.name] || { count: 0, total: 0, poor: 0, good: 0, maximum: null };
        bucket.count += 1;
        if (item.value !== null) {
          bucket.total += item.value;
          bucket.maximum = bucket.maximum === null ? item.value : Math.max(bucket.maximum, item.value);
        }
        if (item.rating === 'POOR') bucket.poor += 1;
        if (item.rating === 'GOOD') bucket.good += 1;
        vitals[item.name] = bucket;
      }
    }
    for (const bucket of Object.values(vitals)) bucket.mean = bucket.count ? Math.round((bucket.total / bucket.count) * 100) / 100 : null;
    return { count: recent.length, byType, vitals, latest: recent.slice(-50).reverse(), generatedAt: new Date().toISOString() };
  }
}
