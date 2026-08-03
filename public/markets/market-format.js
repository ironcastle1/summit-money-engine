const compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

export function marketPrice(value, currency = 'USD') {
  if (!Number.isFinite(value)) return 'N/A';
  const digits = value >= 1000 ? 2 : value >= 1 ? 4 : 6;
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: Math.min(2, digits), maximumFractionDigits: digits }).format(value);
  } catch {
    return `${value.toFixed(digits)} ${currency}`;
  }
}

export function percent(value, digits = 1, signed = false) {
  if (!Number.isFinite(value)) return 'N/A';
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(digits)}%`;
}

export function probability(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : 'N/A';
}

export function score(value) {
  return Number.isFinite(value) ? Math.round(value).toString() : 'N/A';
}

export function compactNumber(value) {
  return Number.isFinite(value) ? compact.format(value) : 'N/A';
}

export function wholeNumber(value) {
  return Number.isFinite(value) ? integer.format(value) : 'N/A';
}

export function age(value) {
  const timestamp = typeof value === 'number' ? value : Date.parse(value);
  if (!Number.isFinite(timestamp)) return 'N/A';
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86_400)}d`;
}

export function stateClass(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'online') return 'positive';
  if (normalized === 'degraded') return 'warning';
  if (normalized === 'offline') return 'negative';
  return 'muted';
}
