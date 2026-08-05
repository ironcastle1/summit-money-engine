export const COMMODITY_GROUPS = Object.freeze({
  ENERGY: Object.freeze(['crude oil', 'brent', 'wti', 'natural gas', 'lng', 'diesel', 'gasoline', 'coal']),
  PRECIOUS_METALS: Object.freeze(['gold', 'silver', 'platinum', 'palladium']),
  INDUSTRIAL_METALS: Object.freeze(['copper', 'aluminium', 'aluminum', 'nickel', 'zinc', 'iron ore', 'steel', 'lithium']),
  GRAINS: Object.freeze(['wheat', 'corn', 'maize', 'soy', 'soybeans', 'rice', 'barley']),
  SOFTS: Object.freeze(['coffee', 'cocoa', 'sugar', 'cotton', 'orange juice', 'rubber']),
  LIVESTOCK: Object.freeze(['cattle', 'hogs', 'pork', 'beef']),
  FERTILIZER: Object.freeze(['potash', 'urea', 'ammonia', 'phosphate'])
});
export function commodityGroup(value) {
  const text = String(value || '').toLowerCase();
  for (const [group, terms] of Object.entries(COMMODITY_GROUPS)) {
    if (terms.some(term => text.includes(term))) return group;
  }
  return 'OTHER';
}
export function commodityTags(asset = {}) {
  const haystack = [asset.id, asset.symbol, asset.name, ...(asset.tags || [])].join(' ').toLowerCase();
  const group = commodityGroup(haystack);
  return Object.freeze({
    isCommodity: group !== 'OTHER' || String(asset.assetClass || '').toLowerCase() === 'commodity',
    group,
    terms: Object.freeze((COMMODITY_GROUPS[group] || []).filter(term => haystack.includes(term)))
  });
}
