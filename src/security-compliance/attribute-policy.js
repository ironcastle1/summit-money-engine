import { clearanceAllows } from './classification-catalog.js';
import { clean } from './utilities.js';

export function evaluateAttributes(input = {}) {
  const reasons = [];
  if (input.tenantId && input.resourceTenantId && input.tenantId !== input.resourceTenantId) reasons.push('TENANT_MISMATCH');
  if (!clearanceAllows(input.clearance || 'INTERNAL', input.classification || 'INTERNAL')) reasons.push('INSUFFICIENT_CLEARANCE');
  if (input.allowedCountries?.length && !input.allowedCountries.includes(String(input.country || '').toUpperCase())) reasons.push('COUNTRY_RESTRICTED');
  if (input.requireManagedDevice && !input.managedDevice) reasons.push('UNMANAGED_DEVICE');
  if (input.requireTrustedNetwork && !input.trustedNetwork) reasons.push('UNTRUSTED_NETWORK');
  if (input.purpose && input.allowedPurposes?.length && !input.allowedPurposes.includes(clean(input.purpose, 100).toUpperCase())) reasons.push('PURPOSE_NOT_ALLOWED');
  return Object.freeze({ allowed: reasons.length === 0, reasons: Object.freeze(reasons) });
}
