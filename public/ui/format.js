export function percent(value, options = {}) {
  if (!Number.isFinite(value)) return 'N/A';
  const digits = options.digits ?? 0;
  const sign = options.sign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function number(value, digits = 0) {
  return Number.isFinite(value) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }) : 'N/A';
}

export function coordinate(value) {
  return Number.isFinite(value) ? Number(value).toFixed(4) : 'N/A';
}

export function age(value, now = Date.now()) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return 'N/A';
  const minutes = Math.max(0, Math.round((now - timestamp) / 60_000));
  if (minutes < 60) return `${minutes}M`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}H`;
  return `${Math.round(hours / 24)}D`;
}

export function durationHours(value) {
  if (!Number.isFinite(value)) return 'N/A';
  if (value < 1) return '<1H';
  if (value < 48) return `${Math.round(value)}H`;
  return `${Math.round(value / 24)}D`;
}

export function upper(value, fallback = 'N/A') {
  const text = String(value || '').trim();
  return text ? text.toUpperCase() : fallback;
}
