function fold(value) { return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
export function tokenize(value) { return fold(value).match(/[a-z0-9]{2,}/g) || []; }
export function textContainsAny(value, terms) {
  const haystack = fold(value);
  return terms.some(term => haystack.includes(fold(term)));
}
export function entityMentionScore(value, entities) {
  const haystack = fold(value);
  let score = 0;
  const matched = [];
  for (const entity of entities) {
    const term = fold(entity);
    if (term.length >= 3 && haystack.includes(term)) { score += Math.min(18, 4 + term.length); matched.push(entity); }
  }
  return { score: Math.min(100, score), matched: [...new Set(matched)] };
}
export function fuzzyPortMatch(query, port) {
  const tokens = tokenize(query);
  if (!tokens.length) return 0;
  const fields = tokenize(`${port.name} ${port.unlocode} ${port.country} ${port.region} ${port.commodities.join(' ')}`);
  let matched = 0;
  for (const token of tokens) if (fields.some(field => field.includes(token) || token.includes(field))) matched += 1;
  return matched / tokens.length;
}
