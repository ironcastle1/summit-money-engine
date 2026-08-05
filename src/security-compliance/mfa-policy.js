export function mfaRequirement(input = {}) {
  const role = String(input.role || '').toUpperCase();
  const privileged = ['OWNER', 'SECURITY_ADMIN', 'COMPLIANCE_ADMIN', 'INCIDENT_COMMANDER'].includes(role);
  const classification = String(input.classification || 'INTERNAL').toUpperCase();
  const required = privileged || ['CONFIDENTIAL', 'RESTRICTED'].includes(classification) || Number(input.sessionRisk || 0) >= 45;
  const phishingResistant = role === 'OWNER' || role === 'SECURITY_ADMIN' || classification === 'RESTRICTED';
  return Object.freeze({ required, phishingResistant, acceptableMethods: phishingResistant ? ['WEBAUTHN', 'HARDWARE_KEY'] : ['WEBAUTHN', 'HARDWARE_KEY', 'TOTP'] });
}
