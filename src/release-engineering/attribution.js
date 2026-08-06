export function thirdPartyAttribution(components = []) {
    const lines = ['THIRD-PARTY ATTRIBUTIONS', '========================'];
    for (const item of [...components].sort((a, b) => String(a.name).localeCompare(String(b.name)))) {
        lines.push('', `${item.name} ${item.version || ''}`.trim(), `License: ${item.license || 'UNKNOWN'}`, item.homepage ? `Homepage: ${item.homepage}` : 'Homepage: not recorded');
    }
    return lines.join('\n');
}
