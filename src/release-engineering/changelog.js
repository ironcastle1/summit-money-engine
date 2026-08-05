export function changelog(entries = []) {
    const groups = new Map();
    for (const entry of entries) {
        const version = entry.version || 'Unreleased';
        if (!groups.has(version))
            groups.set(version, []);
        groups.get(version).push(entry);
    }
    const lines = ['# Changelog'];
    for (const [version, rows] of groups) {
        lines.push('', `## ${version}`);
        for (const row of rows)
            lines.push(`- ${row.title || row.summary || row.id}`);
    }
    return lines.join('\n');
}
