export const EVENT_MARKET_RULES = Object.freeze([
  Object.freeze({ id: 'energy-conflict', pattern: /war|conflict|strike|attack|blockade/i, tags: ['oil', 'gas', 'energy', 'shipping'], direction: 'BULLISH', strength: 24 }),
  Object.freeze({ id: 'port-disruption', pattern: /port|canal|chokepoint|shipping|vessel/i, tags: ['shipping', 'freight', 'oil', 'gas', 'grain'], direction: 'BULLISH', strength: 20 }),
  Object.freeze({ id: 'sanctions', pattern: /sanction|embargo|export control|trade restriction/i, tags: ['country', 'currency', 'commodity'], direction: 'VOLATILE', strength: 22 }),
  Object.freeze({ id: 'major-earthquake', pattern: /earthquake|seismic/i, tags: ['country', 'infrastructure', 'insurance'], direction: 'BEARISH', strength: 18 }),
  Object.freeze({ id: 'flood-agriculture', pattern: /flood|drought|crop failure/i, tags: ['grain', 'softs', 'agriculture', 'food'], direction: 'BULLISH', strength: 19 }),
  Object.freeze({ id: 'wildfire', pattern: /wildfire|forest fire/i, tags: ['insurance', 'utility', 'lumber'], direction: 'BEARISH', strength: 13 }),
  Object.freeze({ id: 'storm', pattern: /hurricane|cyclone|typhoon|storm/i, tags: ['energy', 'insurance', 'shipping', 'agriculture'], direction: 'VOLATILE', strength: 17 }),
  Object.freeze({ id: 'election', pattern: /election|referendum|coalition|government/i, tags: ['country', 'currency', 'index', 'bond'], direction: 'VOLATILE', strength: 12 }),
  Object.freeze({ id: 'rate-policy', pattern: /interest rate|central bank|inflation|monetary policy/i, tags: ['bond', 'currency', 'equity', 'gold'], direction: 'VOLATILE', strength: 20 }),
  Object.freeze({ id: 'technology-restriction', pattern: /chip|semiconductor|technology ban|export licence/i, tags: ['technology', 'semiconductor'], direction: 'BEARISH', strength: 18 })
]);
