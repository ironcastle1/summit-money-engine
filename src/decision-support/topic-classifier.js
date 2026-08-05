import { includesAny } from './text.js';
const RULES = Object.freeze([
  ['CONFLICT', ['conflict','war','battle','strike','frontline','ceasefire','military','terror']],
  ['HAZARDS', ['earthquake','storm','flood','wildfire','volcano','cyclone','drought','tsunami']],
  ['MARKETS', ['market','commodity','currency','equity','bond','price','volatility','prediction market']],
  ['LOGISTICS', ['port','shipping','route','chokepoint','freight','cargo','rail','pipeline']],
  ['COUNTRIES', ['election','sanction','government','country risk','governance','policy','coup']],
  ['OPPORTUNITIES', ['opportunity','profit','trade idea','sourcing','lead generation','arbitrage']]
]);
export function classifyTopic(input = {}) {
  const explicit = String(input.domain || input.section || input.category || '').toUpperCase();
  if (RULES.some(([domain]) => domain === explicit)) return explicit;
  const text = `${input.title || ''} ${input.summary || ''} ${input.description || ''}`;
  for (const [domain, terms] of RULES) if (includesAny(text, terms)) return domain;
  return 'EXECUTIVE';
}
