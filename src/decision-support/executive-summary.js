import { sentence } from './text.js';
export function executiveSummary(signals = [], changes = {}) {
  const ranked = [...signals].sort((a, b) => b.attention.score - a.attention.score);
  const top = ranked.slice(0, 5);
  const critical = ranked.filter(item => item.attention.band === 'CRITICAL');
  const urgent = ranked.filter(item => item.attention.band === 'URGENT');
  const headline = critical[0]?.title || urgent[0]?.title || top[0]?.title || 'No material signals available';
  const lines = top.map(item => sentence(`${item.title}: ${item.summary || item.attention.band}`));
  return Object.freeze({ headline, criticalCount: critical.length, urgentCount: urgent.length, newCount: changes.added?.length || 0, escalatedCount: changes.escalated?.length || 0, lines: Object.freeze(lines) });
}
