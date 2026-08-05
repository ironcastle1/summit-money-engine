import { mean, round } from './numbers.js';
export function buildBriefingSection(id, signals = [], options = {}) {
  const items = [...signals].sort((a, b) => b.attention.score - a.attention.score).slice(0, Number(options.limit) || 20);
  const average = round(mean(items.map(item => item.attention.score)), 1);
  const critical = items.filter(item => item.attention.band === 'CRITICAL').length;
  const urgent = items.filter(item => item.attention.band === 'URGENT').length;
  return Object.freeze({ id, title: options.title || id.replaceAll('_', ' '), count: items.length, critical, urgent, averagePriority: average, items: Object.freeze(items) });
}
