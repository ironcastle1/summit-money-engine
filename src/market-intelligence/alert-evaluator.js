export function evaluateMarketAlerts(watches = [], assets = []) {
  const byId = new Map();
  for (const asset of assets) {
    byId.set(String(asset.asset?.id || asset.id).toLowerCase(), asset);
    byId.set(String(asset.asset?.symbol || asset.symbol).toLowerCase(), asset);
  }
  const alerts = [];
  for (const watch of watches) {
    const asset = byId.get(String(watch.assetId || watch.symbol).toLowerCase()); if (!asset) continue;
    const opportunity = Number(asset.opportunity?.score || 0); const risk = Number(asset.risk?.score || 0); const move = Math.abs(Number(asset.quote?.changePercent || asset.momentum?.returns?.one || 0));
    const direction = asset.opportunity?.direction || asset.momentum?.direction || 'NEUTRAL';
    const reasons = [];
    if (opportunity >= watch.minimumOpportunity) reasons.push(`opportunity ${opportunity} >= ${watch.minimumOpportunity}`);
    if (move >= watch.minimumMovePercent) reasons.push(`move ${move}% >= ${watch.minimumMovePercent}%`);
    if (risk > watch.maximumRisk) reasons.push(`risk ${risk} exceeds ${watch.maximumRisk}`);
    if (watch.directions?.length && watch.directions.includes(direction)) reasons.push(`direction ${direction}`);
    if (!reasons.length) continue;
    alerts.push(Object.freeze({ id: `market-alert:${watch.id}:${Date.now()}`, watchId: watch.id, assetId: asset.asset?.id || asset.id, symbol: asset.asset?.symbol || asset.symbol, severity: risk > watch.maximumRisk ? 'HIGH' : opportunity >= 80 || move >= watch.minimumMovePercent * 2 ? 'HIGH' : 'MEDIUM', opportunityScore: opportunity, riskScore: risk, movePercent: move, direction, reasons: Object.freeze(reasons), generatedAt: new Date().toISOString() }));
  }
  return Object.freeze(alerts.sort((a, b) => b.opportunityScore - a.opportunityScore));
}
