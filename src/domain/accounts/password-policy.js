import { ValidationError } from '../../core/errors.js';

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export function passwordStrength(password) {
  const value = String(password || '');
  const checks = {
    length: value.length >= PASSWORD_MIN_LENGTH,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
    notRepeated: !/(.)\1{4,}/.test(value)
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { score, checks, acceptable: checks.length && score >= 5 };
}

export function validatePassword(password) {
  const value = String(password || '');
  if (value.length < PASSWORD_MIN_LENGTH || value.length > PASSWORD_MAX_LENGTH) {
    throw new ValidationError(`Password length must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}`, { field: 'password' });
  }
  const result = passwordStrength(value);
  if (!result.acceptable) {
    throw new ValidationError('Password must include upper, lower, number and symbol characters', { field: 'password', checks: result.checks });
  }
  return value;
}
