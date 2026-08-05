import { slug } from './text.js';
export function recordId(prefix, value) {
  const base = slug(value || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  return `${prefix}-${base}`.slice(0, 180);
}
export function stableSignalId(signal) {
  return recordId('signal', signal.id || `${signal.domain}-${signal.title}-${signal.time || ''}`);
}
