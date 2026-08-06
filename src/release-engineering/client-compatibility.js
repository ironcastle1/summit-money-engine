import { compareVersions, parseVersion } from './semantic-version.js';
export function clientCompatibility(input = {}) { const client = parseVersion(input.clientVersion), minimum = parseVersion(input.minimumVersion), server = parseVersion(input.serverVersion); const reasons = []; if (!client || !minimum || !server)
    reasons.push('INVALID_VERSION');
else {
    if (compareVersions(input.clientVersion, input.minimumVersion) < 0)
        reasons.push('CLIENT_TOO_OLD');
    if (client.major !== server.major)
        reasons.push('MAJOR_VERSION_MISMATCH');
} return Object.freeze({ compatible: reasons.length === 0, reasons, state: reasons.length ? 'UPGRADE_REQUIRED' : 'SUPPORTED', client, minimum, server }); }
