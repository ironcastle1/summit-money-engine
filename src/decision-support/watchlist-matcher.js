import { tokens } from './text.js';
export function watchMatches(watch, signal) {
  if (watch.enabled === false) return false;
  if (watch.domains?.length && !watch.domains.includes(signal.domain)) return false;
  if (Number(watch.minimumPriority || 0) > Number(signal.attention?.score || 0)) return false;
  const terms = (watch.terms || []).flatMap(tokens);
  if (terms.length) {
    const haystack = new Set(tokens(`${signal.title} ${signal.summary} ${(signal.tags || []).join(' ')} ${signal.location?.label || ''}`));
    if (!terms.some(term => haystack.has(term))) return false;
  }
  return true;
}
export function matchWatchlists(watches = [], signals = []) {
  return Object.freeze(watches.map(watch => Object.freeze({ watch, matches: Object.freeze(signals.filter(signal => watchMatches(watch, signal))) })).filter(item => item.matches.length));
}
