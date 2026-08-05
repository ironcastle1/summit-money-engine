export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

export function score(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1) : '—';
}

export function band(value) {
  const number = Number(value) || 0;
  if (number >= 80) return 'SEVERE';
  if (number >= 65) return 'HIGH';
  if (number >= 45) return 'ELEVATED';
  if (number >= 25) return 'GUARDED';
  return 'LOW';
}

export function relativeTime(value) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 'UNKNOWN';
  const hours = Math.max(0, (Date.now() - time) / 3_600_000);
  if (hours < 1) return `${Math.round(hours * 60)} MIN`;
  if (hours < 48) return `${Math.round(hours)} H`;
  return `${Math.round(hours / 24)} D`;
}
