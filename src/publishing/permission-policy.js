import { frozen, unique } from './utilities.js';

export function publicationPermissionPolicy(input = {}) {
  return frozen({
    owners: unique(input.owners || [], 500),
    editors: unique(input.editors || [], 1000),
    approvers: unique(input.approvers || [], 1000),
    viewers: unique(input.viewers || [], 5000),
    allowExternalSharing: Boolean(input.allowExternalSharing),
    allowDownload: input.allowDownload !== false,
    allowForwarding: Boolean(input.allowForwarding),
    requireWatermark: input.requireWatermark !== false
  });
}

export function permissionFor(policy, actorId) {
  const actor = String(actorId || 'anonymous');
  if ((policy.owners || []).includes(actor)) return 'OWNER';
  if ((policy.approvers || []).includes(actor)) return 'APPROVER';
  if ((policy.editors || []).includes(actor)) return 'EDITOR';
  if ((policy.viewers || []).includes(actor)) return 'VIEWER';
  return 'NONE';
}
