import { canReceiveClassification } from './classification-policy.js';
import { isExpired } from './time.js';
import { frozen } from './utilities.js';

export function evaluateAccess(input = {}) {
  const reasons = [];
  if (input.revoked) reasons.push('LINK_REVOKED');
  if (input.expiresAt && isExpired(input.expiresAt, input.now)) reasons.push('LINK_EXPIRED');
  if (!canReceiveClassification(input.clearance || 'PUBLIC', input.classification || 'PUBLIC')) reasons.push('INSUFFICIENT_CLEARANCE');
  if (input.passcodeRequired && !input.passcodeValid) reasons.push('PASSCODE_REQUIRED');
  if (input.maximumViews && Number(input.views || 0) >= Number(input.maximumViews)) reasons.push('VIEW_LIMIT_REACHED');
  return frozen({ allowed: reasons.length === 0, reasons, downloadAllowed: reasons.length === 0 && input.allowDownload !== false });
}
