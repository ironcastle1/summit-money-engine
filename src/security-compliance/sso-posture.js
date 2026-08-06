export function ssoPosture(config = {}) {
  const findings = [];
  if (!config.enabled) findings.push('SSO_DISABLED');
  if (config.enabled && !config.enforceForAdmins) findings.push('ADMIN_SSO_NOT_ENFORCED');
  if (config.enabled && !config.signedAssertions) findings.push('UNSIGNED_ASSERTIONS_ALLOWED');
  if (config.enabled && !config.certificateExpiresAt) findings.push('CERTIFICATE_EXPIRY_UNKNOWN');
  if (config.enabled && config.jitProvisioning && !config.defaultRole) findings.push('JIT_DEFAULT_ROLE_MISSING');
  return Object.freeze({ enabled: Boolean(config.enabled), protocol: config.protocol || null, healthy: findings.length === 0, findings: Object.freeze(findings) });
}
