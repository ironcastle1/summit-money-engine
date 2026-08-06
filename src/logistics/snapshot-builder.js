export async function buildLogisticsContext(dependencies, options = {}) {
  const includeLive = options.includeLive === true;
  const [shipping, events] = includeLive ? await Promise.all([
    dependencies.shipping?.snapshot?.({ hours: options.hours || 72 }).catch(() => null) || null,
    dependencies.events?.globalSnapshot?.({ days: Math.max(1, Math.ceil((options.hours || 72) / 24)), limit: options.eventLimit || 3000 }).catch(() => null) || null
  ]) : [null, null];
  const nodeRiskById = new Map();
  for (const item of [...(shipping?.ports || []), ...(shipping?.chokepoints || [])]) nodeRiskById.set(String(item.id).toLowerCase(), item.risk || { score: 0 });
  const edgeRiskById = new Map();
  for (const item of shipping?.routes || []) edgeRiskById.set(String(item.id).toLowerCase(), item.risk || { score: 0 });
  return Object.freeze({
    events: Object.freeze(events?.events || []),
    nodeRiskById,
    edgeRiskById,
    shipping,
    sourceStatus: Object.freeze({
      mode: includeLive ? 'LIVE_ENRICHMENT' : 'CATALOGUE_ONLY',
      shipping: shipping?.sourceStatus || {},
      events: events?.sources || {}
    }),
    generatedAt: new Date().toISOString()
  });
}
