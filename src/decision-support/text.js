export function clean(value, maximum = 240) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maximum);
}
export function slug(value, fallback = 'untitled') {
  const result = clean(value, 180).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return result || fallback;
}
export function tokens(value) {
  return clean(value, 8000).toLowerCase().replace(/[^a-z0-9\p{L}]+/gu, ' ').split(/\s+/).filter(Boolean);
}
export function includesAny(value, terms) {
  const haystack = ` ${tokens(value).join(' ')} `;
  return (terms || []).some(term => haystack.includes(String(term).toLowerCase()));
}
export function uniqueText(values, maximum = 120) {
  return [...new Set((values || []).map(value => clean(value, maximum)).filter(Boolean))];
}
export function sentence(value, fallback = '') {
  const result = clean(value, 600);
  if (!result) return fallback;
  return /[.!?]$/.test(result) ? result : `${result}.`;
}
