import { clamp, round } from './numbers.js';
const POSITIVE = /beat|growth|surge|gain|record|upgrade|agreement|recovery|strong|bullish|expand/i;
const NEGATIVE = /miss|decline|fall|loss|downgrade|war|attack|sanction|default|shortage|weak|bearish/i;
export function scoreSentiment(items = []) {
  let weighted = 0; let totalWeight = 0; let positive = 0; let negative = 0;
  for (const item of items) {
    const text = [item.title, item.summary, item.text].filter(Boolean).join(' ');
    const weight = clamp(Number(item.relevance || item.confidence || 50), 1, 100);
    const pos = (text.match(new RegExp(POSITIVE.source, 'gi')) || []).length;
    const neg = (text.match(new RegExp(NEGATIVE.source, 'gi')) || []).length;
    const score = pos === neg ? 0 : (pos - neg) / Math.max(1, pos + neg);
    weighted += score * weight; totalWeight += weight; positive += pos; negative += neg;
  }
  const normalized = totalWeight ? weighted / totalWeight : 0;
  const score = clamp(50 + normalized * 50, 0, 100);
  return Object.freeze({ score: round(score, 2), polarity: round(normalized, 3), state: score >= 60 ? 'POSITIVE' : score <= 40 ? 'NEGATIVE' : 'NEUTRAL', positiveTerms: positive, negativeTerms: negative, sampleSize: items.length });
}
