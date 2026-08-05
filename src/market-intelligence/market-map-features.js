import { round } from './numbers.js';
const REGION_COORDINATES = Object.freeze({
  global: [0, 20], north_america: [-100, 40], europe: [10, 50], uk: [-2, 54], asia: [100, 35], china: [105, 35], japan: [138, 37], india: [78, 22], middle_east: [45, 28], africa: [20, 2], latin_america: [-60, -15], australia: [134, -25]
});
function coordinate(asset) {
  if (Array.isArray(asset.coordinates) && asset.coordinates.length >= 2) return asset.coordinates.slice(0, 2).map(Number);
  const region = String(asset.region || 'global').toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
  return REGION_COORDINATES[region] || REGION_COORDINATES.global;
}
export function marketMapFeatures(assets = []) {
  return Object.freeze({
    type: 'FeatureCollection',
    features: Object.freeze(assets.map(item => {
      const asset = item.asset || item;
      const [longitude, latitude] = coordinate(asset);
      return Object.freeze({
        type: 'Feature',
        id: `market:${asset.id || asset.symbol}`,
        geometry: Object.freeze({ type: 'Point', coordinates: Object.freeze([longitude, latitude]) }),
        properties: Object.freeze({
          type: 'market-signal', assetId: asset.id, symbol: asset.symbol, name: asset.name,
          assetClass: asset.assetClass, price: item.quote?.price || null, changePercent: item.quote?.changePercent || 0,
          opportunityScore: item.opportunity?.score || 0, opportunityTier: item.opportunity?.tier || 'PASS',
          direction: item.opportunity?.direction || 'NEUTRAL', riskScore: item.risk?.score || 0,
          evidenceGrade: item.evidence?.grade || 'UNRATED', radius: round(5 + Number(item.opportunity?.score || 0) / 12, 2)
        })
      });
    }))
  });
}
