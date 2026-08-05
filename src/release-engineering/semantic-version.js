export function parseVersion(value) { const match = String(value || '').trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/); if (!match)
    return null; return Object.freeze({ raw: String(value), major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), prerelease: match[4] || null, build: match[5] || null }); }
export function compareVersions(left, right) { const a = parseVersion(left), b = parseVersion(right); if (!a || !b)
    throw new TypeError('Valid semantic versions required'); for (const key of ['major', 'minor', 'patch'])
    if (a[key] !== b[key])
        return a[key] > b[key] ? 1 : -1; if (a.prerelease === b.prerelease)
    return 0; if (!a.prerelease)
    return 1; if (!b.prerelease)
    return -1; return a.prerelease.localeCompare(b.prerelease); }
export function bumpVersion(value, type = 'patch') { const version = parseVersion(value); if (!version)
    throw new TypeError('Valid semantic version required'); const next = { ...version, prerelease: null, build: null }; if (type === 'major') {
    next.major += 1;
    next.minor = 0;
    next.patch = 0;
}
else if (type === 'minor') {
    next.minor += 1;
    next.patch = 0;
}
else
    next.patch += 1; return `${next.major}.${next.minor}.${next.patch}`; }
