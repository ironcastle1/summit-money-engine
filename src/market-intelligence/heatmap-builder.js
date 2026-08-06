import { clamp, round } from './numbers.js';
export function buildMarketHeatmap(assets = [], options = {}) {
  const metric = String(options.metric || 'changePercent');
  const groups = new Map();
  for (const asset of assets) {
    const group = String(asset.asset?.assetClass || asset.assetClass || 'other').toUpperCase();
    const value = metric === 'opportunityScore' ? Number(asset.opportunity?.score || 0) : metric === 'riskScore' ? Number(asset.risk?.score || 0) : Number(asset.quote?.changePercent || asset.momentum?.returns?.one || 0);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(Object.freeze({ id: asset.asset?.id || asset.id, symbol: asset.asset?.symbol || asset.symbol, name: asset.asset?.name || asset.name, value: round(value, 3), intensity: round(clamp(Math.abs(value) / (metric === 'changePercent' ? 8 : 100), 0, 1), 3), direction: value > 0 ? 'POSITIVE' : value < 0 ? 'NEGATIVE' : 'FLAT' }));
  }
  return Object.freeze({ metric, groups: Object.freeze([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, items]) => Object.freeze({ name, items: Object.freeze(items.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))) }))) });
}
