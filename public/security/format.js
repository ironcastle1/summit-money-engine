export function escapeSecurity(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

export function securityNumber(value, digits = 0) {
  return Number(value || 0).toLocaleString('en-GB', { maximumFractionDigits: digits });
}

export function securityAge(value) {
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime())) return 'UNKNOWN';
  const hours = Math.max(0, (Date.now() - date.getTime()) / 3600000);
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 48) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function stateClass(value) {
  return `security-state-${String(value || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}
