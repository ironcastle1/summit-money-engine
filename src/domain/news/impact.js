import { clamp, round } from '../../core/numbers.js';

const CATEGORY_ASSETS = Object.freeze({
  conflict: ['BRENT','WTI','XAU','DXY','LMT','BA'], terror: ['XAU','DXY','BRENT'], protest: ['DXY','XAU'],
  earthquake: ['XAU'], volcano: ['XAU','BRENT'], wildfire: ['NG','XAU'], storm: ['NG','BRENT','WTI'], flood: ['XAU','WHEAT'],
  energy: ['BRENT','WTI','NG','XLE'], transport: ['BRENT','WTI','BDRY'], infrastructure: ['XAU','DXY'],
  economic: ['SPX','NDX','DXY','XAU','BTC'], cyber: ['BTC','NDX','PANW','CRWD'], election: ['DXY','SPX','XAU'],
  health: ['XAU','DXY','XLV'], crime: ['XAU'], other: []
});

const DIRECTION_RULES = Object.freeze({
  conflict: { XAU: 1, DXY: 0.5, BRENT: 0.7, WTI: 0.7, LMT: 0.7, BA: -0.2 },
  terror: { XAU: 0.8, DXY: 0.4, BRENT: 0.3 }, storm: { NG: 0.6, BRENT: 0.3, WTI: 0.3 },
  energy: { BRENT: 0.7, WTI: 0.7, NG: 0.6, XLE: 0.4 }, cyber: { BTC: -0.3, NDX: -0.2, PANW: 0.4, CRWD: 0.4 },
  economic: { SPX: 0, NDX: 0, DXY: 0, XAU: 0, BTC: 0 }, election: { DXY: 0, SPX: 0, XAU: 0.2 }
});

function explicitDirection(story, symbol) {
  const text = `${story.title} ${story.summary}`.toLowerCase();
  const negative = /\b(shutdown|halt|cut|sanction|attack|damage|shortage|ban|block|close|collapse|fall|drop|miss|weak|recession)\b/.test(text);
  const positive = /\b(reopen|resume|increase|surge|rise|gain|beat|strong|agreement|ceasefire|approval|stimulus)\b/.test(text);
  if (negative === positive) return null;
  const commodity = ['BRENT','WTI','NG','XAU'].includes(symbol);
  if (commodity && /\b(shortage|halt|cut|sanction|attack|damage|block|close)\b/.test(text)) return 1;
  return positive ? 1 : -1;
}

export function storyImpacts(story) {
  const symbols = [...new Set([...(CATEGORY_ASSETS[story.category] || []), ...story.tickers])].slice(0, 12);
  return symbols.map(symbol => {
    const baseDirection = DIRECTION_RULES[story.category]?.[symbol] ?? 0;
    const direction = explicitDirection(story, symbol) ?? baseDirection;
    const evidence = clamp(story.verification.score / 100, 0, 1);
    const urgency = clamp(story.urgencyScore / 100, 0, 1);
    const relevance = story.tickers.includes(symbol) ? 1 : 0.65;
    const confidence = round(clamp((evidence * 0.55 + urgency * 0.25 + relevance * 0.2) * (direction === 0 ? 0.55 : 1) * 100, 0, 100));
    return Object.freeze({
      symbol,
      direction: direction > 0.15 ? 'UP' : direction < -0.15 ? 'DOWN' : 'UNCLEAR',
      directionalStrength: round(Math.abs(direction) * 100),
      confidence,
      horizonHours: story.category === 'economic' ? 24 : story.category === 'conflict' || story.category === 'energy' ? 12 : 6,
      basis: story.tickers.includes(symbol) ? 'EXPLICIT_MENTION' : 'CATEGORY_MAPPING'
    });
  }).sort((a, b) => b.confidence - a.confidence);
}
