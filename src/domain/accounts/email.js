import { ValidationError } from '../../core/errors.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function validateEmail(value) {
  const email = normalizeEmail(value);
  if (email.length < 5 || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new ValidationError('Email address is invalid', { field: 'email' });
  }
  return email;
}

export function maskEmail(value) {
  const email = normalizeEmail(value);
  const [local, domain] = email.split('@');
  if (!local || !domain) return '';
  const visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(2, local.length - visible.length))}@${domain}`;
}
