export function clean(value,
maximum = 240) {
  return String(value ?? '').replace(/\s+/g,
  ' ').trim().slice(0,
  maximum);
}
export function tokens(value) {
  return clean(value,
  5000).toLowerCase().replace(/[^a-z0-9\p{L}]+/gu,
  ' ').split(/\s+/).filter(Boolean);
}
export function includesAny(value,
terms) {
  const haystack = ` ${tokens(value).join(' ')} `;
  return (terms || []).some(term => haystack.includes(` ${String(term).toLowerCase()} `) || haystack.includes(String(term).toLowerCase()));
}
export function uniqueText(values,
maximum = 80) {
  return [...new Set((values || []).map(value => clean(value,
  maximum)).filter(Boolean))];
}
export function slug(value,
fallback = 'unknown') {
  const result = clean(value,
  160).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,
  '-').replace(/^-|-$/g,
  '');
  return result || fallback;
}
