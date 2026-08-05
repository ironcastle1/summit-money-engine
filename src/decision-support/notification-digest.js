export function notificationDigest(snapshot, options = {}) {
  const minimum = Number(options.minimumPriority || 60);
  const items = (snapshot.signals || []).filter(signal => signal.attention.score >= minimum).slice(0, Number(options.limit) || 25);
  return Object.freeze({ generatedAt: new Date().toISOString(), minimumPriority: minimum, count: items.length, items: Object.freeze(items.map(signal => Object.freeze({ id: signal.id, title: signal.title, domain: signal.domain, score: signal.attention.score, band: signal.attention.band, time: signal.time }))) });
}
