const CONFLICTS = Object.freeze([
  ['BILLING_ADMIN', 'PAYMENT_APPROVER'],
  ['SECURITY_ADMIN', 'AUDIT_APPROVER'],
  ['DEVELOPER', 'PRODUCTION_APPROVER'],
  ['CASE_OWNER', 'CASE_AUDITOR'],
  ['REPORT_AUTHOR', 'REPORT_FINAL_APPROVER']
]);

export function segregationConflicts(assignments = []) {
  const byUser = new Map();
  for (const assignment of assignments) {
    const userId = String(assignment.userId || '');
    if (!byUser.has(userId)) byUser.set(userId, new Set());
    byUser.get(userId).add(String(assignment.role || '').toUpperCase());
  }
  const findings = [];
  for (const [userId, roles] of byUser) {
    for (const [left, right] of CONFLICTS) {
      if (roles.has(left) && roles.has(right)) findings.push(Object.freeze({ userId, left, right, severity: 'HIGH' }));
    }
  }
  return Object.freeze(findings);
}
