import { makePublishingId } from './ids.js';
import { hashPasscode } from './passcode.js';
import { signShareToken } from './secure-token.js';
import { addHours } from './time.js';
import { clean, frozen } from './utilities.js';

export function createShareLink(input = {}, secret) {
  const id = clean(input.id, 190) || makePublishingId('share', input.editionId);
  const issuedAt = new Date().toISOString();
  const expiresAt = input.expiresAt || addHours(issuedAt, Math.max(1, Number(input.lifetimeHours) || 168)).toISOString();
  const payload = { id, editionId: clean(input.editionId, 190), owner: clean(input.owner, 190), issuedAt, expiresAt };
  return frozen({
    ...payload,
    token: signShareToken(payload, secret),
    classification: String(input.classification || 'CLIENT').toUpperCase(),
    clearance: String(input.clearance || input.classification || 'CLIENT').toUpperCase(),
    allowDownload: input.allowDownload !== false,
    maximumViews: Math.max(0, Number(input.maximumViews) || 0),
    views: 0,
    passcode: input.passcode ? hashPasscode(input.passcode) : null,
    revoked: false
  });
}
