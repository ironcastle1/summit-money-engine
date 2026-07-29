export const SECOND_MS = 1_000;
export const MINUTE_MS = 60 * SECOND_MS;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

export function toTimestamp(value) {
  if (value instanceof Date) return value.getTime();
  const timestamp = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function toIso(value) {
  const timestamp = toTimestamp(value);
  return timestamp === null ? null : new Date(timestamp).toISOString();
}

export function ageMs(value, now = Date.now()) {
  const timestamp = toTimestamp(value);
  return timestamp === null ? null : Math.max(0, now - timestamp);
}

export function startOfUtcDay(value) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function utcDayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export function sleep(ms, signal) {
  if (!Number.isFinite(ms) || ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (!signal) return;
    if (signal.aborted) {
      clearTimeout(timer);
      reject(signal.reason || new Error('Aborted'));
      return;
    }
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason || new Error('Aborted'));
    }, { once: true });
  });
}
