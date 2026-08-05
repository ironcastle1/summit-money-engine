export function encryptionPosture(input = {}) {
  const findings = [];
  if (!input.atRest) findings.push('ENCRYPTION_AT_REST_MISSING');
  if (!input.inTransit) findings.push('ENCRYPTION_IN_TRANSIT_MISSING');
  if (input.inTransit && Number(input.minimumTlsVersion || 0) < 1.2) findings.push('TLS_VERSION_WEAK');
  if (input.customerManagedKeysRequired && !input.customerManagedKeys) findings.push('CUSTOMER_MANAGED_KEYS_MISSING');
  if (!input.keyRotationEnabled) findings.push('KEY_ROTATION_DISABLED');
  return Object.freeze({ compliant: findings.length === 0, findings: Object.freeze(findings), atRest: Boolean(input.atRest), inTransit: Boolean(input.inTransit), minimumTlsVersion: Number(input.minimumTlsVersion || 0) });
}
