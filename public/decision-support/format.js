export function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
export function number(value, digits = 0) { return Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }) : '—'; }
export function age(value) { const parsed = Date.parse(value || ''); if (!Number.isFinite(parsed)) return '—'; const minutes = Math.max(0, Math.floor((Date.now() - parsed) / 60000)); return minutes < 60 ? `${minutes}M` : minutes < 2880 ? `${Math.floor(minutes / 60)}H` : `${Math.floor(minutes / 1440)}D`; }
export function bandClass(value) { return String(value || 'ROUTINE').toLowerCase().replaceAll('_', '-'); }
export function shortText(value, maximum = 180) { const text = String(value || ''); return text.length > maximum ? `${text.slice(0, maximum - 1)}…` : text; }
