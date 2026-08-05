export const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
export const number = value => new Intl.NumberFormat('en-GB').format(Number(value || 0));
export const money = minor => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(minor || 0) / 100);
export const percent = value => `${Number(value || 0).toFixed(1)}%`;
export const date = value => value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
export const tone = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
