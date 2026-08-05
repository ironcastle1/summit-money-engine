export function number(value, digits = 0) { return Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }) : '—'; }
export function money(value) { return Number.isFinite(Number(value)) ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value)) : '—'; }
export function duration(hours) { const value = Number(hours); if (!Number.isFinite(value)) return '—'; const days = Math.floor(value / 24); const remaining = Math.round(value % 24); return days ? `${days}d ${remaining}h` : `${remaining}h`; }
export function dateTime(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(); }
export function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
