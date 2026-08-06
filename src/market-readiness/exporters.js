function csvCell(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function exportReadiness(snapshot, format = 'json') {
  if (format === 'json') return { extension: 'json', contentType: 'application/json; charset=utf-8', body: JSON.stringify(snapshot, null, 2) };
  if (format === 'csv') {
    const rows = [['section', 'status', 'score_or_value']];
    rows.push(['overall', snapshot.readiness?.status || snapshot.status, snapshot.readiness?.score ?? '']);
    for (const detail of snapshot.readiness?.details || []) rows.push([detail.section, detail.status, detail.score ?? '']);
    return { extension: 'csv', contentType: 'text/csv; charset=utf-8', body: rows.map(row => row.map(csvCell).join(',')).join('\n') };
  }
  const lines = [
    '# Merlin Market-Readiness Report',
    '',
    `Status: **${snapshot.readiness?.status || snapshot.status || 'NOT_EVALUATED'}**`,
    `Score: **${snapshot.readiness?.score ?? '—'}**`,
    '',
    '## Acceptance areas',
    ...(snapshot.readiness?.details || []).map(detail => `- ${detail.section}: ${detail.status}${detail.score === null ? '' : ` (${detail.score})`}`),
    '',
    `Generated: ${snapshot.generatedAt || new Date().toISOString()}`
  ];
  return { extension: 'md', contentType: 'text/markdown; charset=utf-8', body: lines.join('\n') };
}
