import { clamp, round } from './numbers.js';
function overlap(left = [], right = []) {
  const target = new Set(right.map(item => String(item).toLowerCase()));
  return left.map(item => String(item).toLowerCase()).filter(item => target.has(item));
}
export function calculateTradeExposure(asset = {}, event = {}) {
  const assetTags = [asset.id, asset.symbol, asset.name, asset.country, ...(asset.tags || [])].filter(Boolean);
  const eventTags = [event.country, event.region, event.commodity, ...(event.tags || []), ...(event.entities || [])].filter(Boolean);
  const matches = overlap(assetTags, eventTags);
  const directCountry = asset.country && event.country && String(asset.country).toLowerCase() === String(event.country).toLowerCase();
  const directCommodity = asset.commodity && event.commodity && String(asset.commodity).toLowerCase() === String(event.commodity).toLowerCase();
  const routeExposure = Number(event.routeExposure || event.logisticsExposure || 0);
  const sanctionExposure = /sanction|embargo|export control/i.test(`${event.type || ''} ${event.title || ''}`) ? 25 : 0;
  const score = clamp(matches.length * 12 + (directCountry ? 30 : 0) + (directCommodity ? 35 : 0) + routeExposure * 0.25 + sanctionExposure, 0, 100);
  return Object.freeze({
    score: round(score, 2), directCountry: Boolean(directCountry), directCommodity: Boolean(directCommodity),
    routeExposure: round(routeExposure, 2), sanctionExposure, matchedTerms: Object.freeze([...new Set(matches)]),
    material: score >= 35
  });
}
