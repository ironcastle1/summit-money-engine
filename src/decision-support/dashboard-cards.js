import { mean, round } from './numbers.js';
export function dashboardCards(snapshot) {
  const signals = snapshot.signals || [];
  const byDomain = new Map();
  for (const signal of signals) byDomain.set(signal.domain, (byDomain.get(signal.domain) || 0) + 1);
  return Object.freeze([
    Object.freeze({ id: 'attention', label: 'Attention index', value: round(mean(signals.slice(0, 20).map(item => item.attention.score)), 1), note: 'Top twenty signals' }),
    Object.freeze({ id: 'critical', label: 'Critical', value: signals.filter(item => item.attention.band === 'CRITICAL').length, note: 'Immediate review' }),
    Object.freeze({ id: 'watch-hits', label: 'Watch hits', value: snapshot.alerts?.length || 0, note: 'Matched rules' }),
    Object.freeze({ id: 'coverage', label: 'Evidence coverage', value: snapshot.brief?.coverage?.score || 0, note: snapshot.brief?.coverage?.band || 'NONE' }),
    Object.freeze({ id: 'gaps', label: 'Verification gaps', value: snapshot.brief?.gaps?.count || 0, note: 'Need corroboration' }),
    ...[...byDomain.entries()].map(([domain, count]) => Object.freeze({ id: `domain-${domain.toLowerCase()}`, label: domain, value: count, note: 'Current signals' }))
  ]);
}
