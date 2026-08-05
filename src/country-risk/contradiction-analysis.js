export function analyzeContradictions(claims = []) {
  const groups = new Map();
  for (const claim of claims) {
    const key = String(claim.key || claim.metric || claim.topic || 'general');
    const group = groups.get(key) || [];
    group.push(claim);
    groups.set(key, group);
  }
  const contradictions = [];
  for (const [key, group] of groups) {
    const polarities = new Set(group.map(item => Math.sign(Number(item.direction ?? item.value ?? 0))).filter(Boolean));
    if (polarities.size > 1) contradictions.push(Object.freeze({
      key, claims: Object.freeze(group.slice(0, 20)), severity: Math.min(100, 25 + group.length * 10)
    }));
  }
  return Object.freeze({
    contradictions: Object.freeze(contradictions), count: contradictions.length
  });
}
