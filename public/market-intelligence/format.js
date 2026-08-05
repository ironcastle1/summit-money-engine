export function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
export function number(value, digits = 1) { return Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: digits }) : '—'; }
export function percent(value, digits = 2) { const numeric = Number(value); return Number.isFinite(numeric) ? `${numeric > 0 ? '+' : ''}${numeric.toFixed(digits)}%` : '—'; }
export function price(value) {
  const numeric = Number(value); if (!Number.isFinite(numeric)) return '—';
  const digits = numeric >= 100 ? 2 : numeric >= 1 ? 4 : 8;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: digits }).format(numeric);
}
export function age(value) {
  const timestamp = Date.parse(value || ''); if (!Number.isFinite(timestamp)) return '—';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  return minutes < 1 ? 'NOW' : minutes < 60 ? `${minutes}M` : minutes < 2880 ? `${Math.floor(minutes / 60)}H` : `${Math.floor(minutes / 1440)}D`;
}
