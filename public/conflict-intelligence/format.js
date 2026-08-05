export const escapeConflict = value => String(value ?? '').replace(/[&<>"']/g,
char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}
[char]));
export const conflictNumber = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined,
{
  maximumFractionDigits: 1
}) : '—';
export const conflictBand = score => Number(score) >= 80 ? 'extreme' : Number(score) >= 65 ? 'critical' : Number(score) >= 45 ? 'serious' : Number(score) >= 25 ? 'elevated' : 'routine';
