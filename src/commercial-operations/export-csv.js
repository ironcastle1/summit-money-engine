function quote(value) {
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
}
export function commercialCsv(rows = []) {
    const keys = [...new Set(rows.flatMap(row => Object.keys(row)))];
    return [
        keys.map(quote).join(','),
        ...rows.map(row => keys.map(key => quote(row[key])).join(','))
    ].join('\n');
}
