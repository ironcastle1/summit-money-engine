const PLAYBOOKS = Object.freeze({
  ACCOUNT_TAKEOVER: ['Disable account', 'Revoke sessions', 'Reset credentials', 'Review audit trail', 'Notify account owner'],
  DATA_EXPOSURE: ['Contain access path', 'Preserve evidence', 'Identify data classes', 'Assess notification duty', 'Remediate control gap'],
  MALWARE: ['Isolate systems', 'Capture indicators', 'Block persistence', 'Restore trusted state', 'Hunt for lateral movement'],
  SERVICE_DISRUPTION: ['Stabilise service', 'Activate continuity plan', 'Notify customers', 'Recover dependencies', 'Complete post-incident review'],
  SUPPLY_CHAIN: ['Disable integration', 'Identify affected versions', 'Rotate credentials', 'Assess downstream impact', 'Require vendor evidence']
});

export function responsePlaybook(type) {
  const id = String(type || 'DATA_EXPOSURE').toUpperCase();
  const steps = PLAYBOOKS[id] || PLAYBOOKS.DATA_EXPOSURE;
  return Object.freeze({ id, steps: Object.freeze(steps.map((title, index) => ({ order: index + 1, title, state: 'PENDING' }))) });
}
