export function score(value) {
  return Number.isFinite(Number(value))?Math.round(Number(value)):0;
}
export function age(value) {
  const ms=Date.now()-Date.parse(value);
  if(!Number.isFinite(ms))return'UNKNOWN';
  const h=Math.max(0, ms/3_600_000);
  return h<1?`${Math.round(h*60)} MIN`:h<48?`${Math.round(h)} H`: `${Math.round(h/24)} D`;
}
export function money(value) {
  const n=Number(value);
  if(!Number.isFinite(n))return'—';
  return new Intl.NumberFormat('en-GB', {
    style:'currency', currency:'USD', notation:'compact', maximumFractionDigits:1
  }).format(n);
}
export function text(value) {
  return String(value??'').replace(/[<>]/g, '');
}
