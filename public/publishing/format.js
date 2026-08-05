export const escapePublishing = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
export const publishingNumber = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—';
export const publishingAge = value => { const time = Date.parse(value || ''); if (!Number.isFinite(time)) return '—'; const hours = Math.max(0, Math.floor((Date.now() - time) / 3600000)); return hours < 1 ? 'NOW' : hours < 48 ? `${hours}H` : `${Math.floor(hours / 24)}D`; };
export const stateClass = value => String(value || 'DRAFT').toLowerCase().replaceAll('_', '-');
