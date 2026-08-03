import { stableId } from '../../core/ids.js';
import { clamp, round } from '../../core/numbers.js';
import { normalizeText } from './text.js';

const DIRECTION_PATTERNS = Object.freeze([
  ['UP', /\b(rise|rises|rose|rising|increase|increases|increased|gain|gains|gained|surge|surges|surged|jump|jumps|jumped|higher|accelerat(?:e|es|ed|ing)|expand(?:s|ed|ing)?)\b/i],
  ['DOWN', /\b(fall|falls|fell|falling|decrease|decreases|decreased|drop|drops|dropped|decline|declines|declined|lower|contract(?:s|ed|ing)?|slow(?:s|ed|ing)?|collapse(?:s|d)?)\b/i],
  ['HALT', /\b(halt|halts|halted|stop|stops|stopped|suspend|suspends|suspended|close|closes|closed|shutdown|shut down|blocked?)\b/i],
  ['RESUME', /\b(resume|resumes|resumed|restart|restarts|restarted|reopen|reopens|reopened|restore|restores|restored)\b/i],
  ['DENY', /\b(deny|denies|denied|reject|rejects|rejected|false|incorrect|not true|no evidence)\b/i],
  ['CONFIRM', /\b(confirm|confirms|confirmed|verify|verifies|verified|evidence shows|officially)\b/i]
]);

const METRIC_PATTERNS = Object.freeze([
  ['PRICE', /\b(price|prices|cost|costs|trading at|worth|valuation)\b/i],
  ['VOLUME', /\b(volume|output|production|exports?|imports?|shipments?|supply|demand|barrels?|tonnes?|tons?)\b/i],
  ['RATE', /\b(rate|rates|yield|yields|interest|inflation|unemployment|growth|gdp)\b/i],
  ['CASUALTIES', /\b(killed|dead|deaths?|fatalities|injured|wounded|casualties)\b/i],
  ['COUNT', /\b(people|homes?|buildings?|vehicles?|flights?|vessels?|companies|countries|votes?|seats?)\b/i],
  ['DISTANCE', /\b(km|kilometres?|kilometers?|miles?|metres?|meters?)\b/i],
  ['TIME', /\b(hours?|days?|weeks?|months?|years?|minutes?)\b/i]
]);

function sentences(value) {
  return String(value || '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+|\n+/).map(item => item.trim()).filter(item => item.length >= 12).slice(0, 80);
}

function numberClaims(sentence) {
  const patterns = [
    { type: 'PERCENT', regex: /(?:about|around|nearly|over|more than|less than|at least|up to)?\s*([-+]?\d+(?:\.\d+)?)\s*(%|percent|percentage points?)/gi, multiplier: 1 },
    { type: 'MONEY', regex: /(?:£|\$|€)\s*([\d,.]+)\s*(trillion|billion|million|thousand|tn|bn|m|k)?/gi, multiplier: 1 },
    { type: 'NUMBER', regex: /\b(?:about|around|nearly|over|more than|less than|at least|up to)?\s*([\d,.]+)\s*(trillion|billion|million|thousand|tn|bn|m|k)?\b/gi, multiplier: 1 }
  ];
  const output = [];
  for (const pattern of patterns) {
    for (const match of sentence.matchAll(pattern.regex)) {
      const raw = Number(String(match[1]).replace(/,/g, ''));
      if (!Number.isFinite(raw)) continue;
      const unit = String(match[2] || '').toLowerCase();
      const factor = /trillion|tn/.test(unit) ? 1e12 : /billion|bn/.test(unit) ? 1e9 : /million|m/.test(unit) ? 1e6 : /thousand|k/.test(unit) ? 1e3 : 1;
      output.push({ type: pattern.type, raw: match[0].trim(), value: raw * factor, unit: unit || null, index: match.index || 0 });
    }
  }
  const unique = new Map();
  for (const claim of output) unique.set(`${claim.index}:${claim.raw}`, claim);
  return [...unique.values()].sort((a, b) => a.index - b.index).slice(0, 8);
}

function direction(sentence) {
  const matches = DIRECTION_PATTERNS.filter(([, pattern]) => pattern.test(sentence)).map(([name]) => name);
  if (matches.includes('UP') && matches.includes('DOWN')) return 'MIXED';
  return matches[0] || 'NEUTRAL';
}

function metric(sentence) {
  return METRIC_PATTERNS.find(([, pattern]) => pattern.test(sentence))?.[0] || 'GENERAL';
}

function subject(sentence, entities = []) {
  const explicit = entities.find(entity => sentence.toLowerCase().includes(entity.toLowerCase()));
  if (explicit) return explicit;
  const normalized = normalizeText(sentence).split(' ').filter(token => token.length > 3);
  return normalized.slice(0, 4).join(' ') || 'general';
}

function attribution(sentence) {
  const quote = sentence.match(/[“"]([^”"]{8,240})[”"]/);
  const speaker = sentence.match(/\b(?:said|says|according to|reported by|stated|announced)\s+([A-Z][A-Za-z .'-]{2,80})/);
  return { quotedText: quote?.[1] || null, attributedTo: speaker?.[1]?.trim() || null };
}

export function extractClaims(article) {
  const combined = `${article.title}. ${article.summary}`;
  const output = [];
  for (const sentence of sentences(combined)) {
    const numbers = numberClaims(sentence);
    const movement = direction(sentence);
    const statement = attribution(sentence);
    if (!numbers.length && movement === 'NEUTRAL' && !statement.quotedText) continue;
    const claimMetric = metric(sentence);
    const claimSubject = subject(sentence, article.entities || []);
    const confidence = clamp((numbers.length ? 30 : 0) + (movement !== 'NEUTRAL' ? 25 : 0) + (statement.attributedTo ? 20 : 0) + (article.sourceType === 'NEWS' ? 15 : 5) + Math.min(10, sentence.length / 30), 0, 100);
    output.push(Object.freeze({
      id: stableId('claim', article.id, sentence),
      articleId: article.id,
      sourceDomain: article.sourceDomain,
      subject: claimSubject,
      metric: claimMetric,
      direction: movement,
      values: Object.freeze(numbers),
      sentence: sentence.slice(0, 500),
      attributedTo: statement.attributedTo,
      quotedText: statement.quotedText,
      confidence: round(confidence)
    }));
  }
  return output.slice(0, 30);
}
