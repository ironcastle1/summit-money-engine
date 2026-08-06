import { clean, unique } from './utilities.js';

export function processingAgreementStatus(input = {}) {
  const missing = [];
  if (!input.signedAt) missing.push('DPA_NOT_SIGNED');
  if (!input.processingPurpose) missing.push('PURPOSE_MISSING');
  if (!(input.dataCategories || []).length) missing.push('DATA_CATEGORIES_MISSING');
  if (!(input.subprocessors || []).length && input.usesSubprocessors) missing.push('SUBPROCESSORS_UNDECLARED');
  if (input.internationalTransfer && !input.transferMechanism) missing.push('TRANSFER_MECHANISM_MISSING');
  return Object.freeze({
    vendorId: clean(input.vendorId, 190),
    compliant: missing.length === 0,
    missing: Object.freeze(missing),
    transferMechanism: clean(input.transferMechanism, 100).toUpperCase() || null,
    subprocessors: Object.freeze(unique(input.subprocessors || []))
  });
}
