import { CLASSIFICATIONS, INCIDENT_SEVERITIES } from './constants.js';

export function validateSecurityInput(type, input = {}) {
  const errors = [];
  if (input.tenantId !== undefined && !String(input.tenantId).trim()) errors.push('tenantId must not be empty');
  if (input.classification && !CLASSIFICATIONS.includes(String(input.classification).toUpperCase())) errors.push('classification is invalid');
  if (input.severity && type === 'incident' && !INCIDENT_SEVERITIES.includes(String(input.severity).toUpperCase())) errors.push('incident severity is invalid');
  if (type === 'risk' && !String(input.title || '').trim()) errors.push('risk title is required');
  if (type === 'evidence' && !String(input.controlId || '').trim()) errors.push('evidence controlId is required');
  if (type === 'vendor' && !String(input.name || '').trim()) errors.push('vendor name is required');
  if (errors.length) {
    const error = new TypeError(errors.join('; '));
    error.code = 'SECURITY_VALIDATION_FAILED';
    error.details = errors;
    throw error;
  }
  return true;
}
