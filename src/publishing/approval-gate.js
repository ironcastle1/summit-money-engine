import { frozen } from './utilities.js';

export function approvalGate(input = {}) {
  const required = input.required !== false;
  const approvals = Array.isArray(input.approvals) ? input.approvals : [];
  const approved = approvals.filter(item => String(item.state || item.status).toUpperCase() === 'APPROVED');
  const rejected = approvals.filter(item => String(item.state || item.status).toUpperCase() === 'REJECTED');
  const minimum = Math.max(1, Number(input.minimumApprovals) || 1);
  const reasons = [];
  if (rejected.length) reasons.push('REJECTED');
  if (required && approved.length < minimum) reasons.push('APPROVAL_REQUIRED');
  return frozen({ passed: reasons.length === 0, required, minimum, approvals: approved.length, rejections: rejected.length, reasons });
}
