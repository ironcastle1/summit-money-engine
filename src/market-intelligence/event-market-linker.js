import { clamp, round } from './numbers.js';
import { calculateTradeExposure } from './trade-exposure.js';
import { EVENT_MARKET_RULES } from './event-market-rules.js';
function assetMatchesRule(asset, rule) {
  const text = [asset.id, asset.symbol, asset.name, asset.assetClass, ...(asset.tags || [])].join(' ').toLowerCase();
  return rule.tags.some(tag => text.includes(tag));
}
export function linkEventToAssets(event = {}, assets = []) {
  const eventText = [event.type, event.category, event.title, event.summary, ...(event.tags || [])].filter(Boolean).join(' ');
  const matchingRules = EVENT_MARKET_RULES.filter(rule => rule.pattern.test(eventText));
  const baseSeverity = clamp(Number(event.severity ?? event.impactScore ?? 50), 0, 100);
  const confidence = clamp(Number(event.confidence ?? event.sourceConfidence ?? 60), 0, 100);
  const links = [];
  for (const asset of assets) {
    const exposure = calculateTradeExposure(asset, event);
    const rules = matchingRules.filter(rule => assetMatchesRule(asset, rule));
    if (!rules.length && !exposure.material) continue;
    const ruleStrength = rules.reduce((maximum, rule) => Math.max(maximum, rule.strength), 0);
    const relevance = clamp(ruleStrength + exposure.score * 0.55 + baseSeverity * 0.25 + confidence * 0.1, 0, 100);
    const directions = rules.map(rule => rule.direction);
    const direction = directions.includes('VOLATILE') ? 'VOLATILE' : directions.filter(value => value === 'BULLISH').length > directions.filter(value => value === 'BEARISH').length ? 'BULLISH' : directions.includes('BEARISH') ? 'BEARISH' : 'NEUTRAL';
    links.push(Object.freeze({
      eventId: String(event.id || event.eventId || ''), assetId: String(asset.id || asset.symbol), symbol: String(asset.symbol || asset.id),
      relevance: round(relevance, 2), direction, ruleIds: Object.freeze(rules.map(rule => rule.id)), exposure,
      explanation: `${rules.map(rule => rule.id).join(', ') || 'direct exposure'}; relevance ${round(relevance, 1)}/100`
    }));
  }
  return Object.freeze(links.sort((a, b) => b.relevance - a.relevance));
}
