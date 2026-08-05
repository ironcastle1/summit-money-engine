import { ValidationError } from './errors.js';

export function optionalString(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
}

export function requiredEnum(value, allowed, name = 'value') {
  const normalized = String(value).trim().toLowerCase();
  if (!allowed.includes(normalized)) {
    throw new ValidationError(`${name} must be one of: ${allowed.join(', ')}`, { name, value });
  }
  return normalized;
}

export function clampInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function finiteNumber(value, name, options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new ValidationError(`${name} must be a finite number`, { name, value });
  }
  if (Number.isFinite(options.min) && number < options.min) {
    throw new ValidationError(`${name} must be at least ${options.min}`, { name, value: number });
  }
  if (Number.isFinite(options.max) && number > options.max) {
    throw new ValidationError(`${name} must not exceed ${options.max}`, { name, value: number });
  }
  return number;
}

export function boundedString(value, name, options = {}) {
  const text = String(value ?? '').trim();
  const min = options.min ?? 0;
  const max = options.max ?? 500;
  if (text.length < min || text.length > max) {
    throw new ValidationError(`${name} length must be ${min}-${max}`, { name, length: text.length });
  }
  return text;
}

export function booleanParam(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

export function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}
