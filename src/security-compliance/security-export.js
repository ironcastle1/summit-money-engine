function cell(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export function securityJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function securityCsv(rows = []) {
  const keys = [...new Set(rows.flatMap(row => Object.keys(row || {})))];
  const lines = [
    keys.map(cell).join(','),
    ...rows.map(row => keys.map(key => cell(row[key])).join(','))
  ];
  return `${lines.join('\n')}\n`;
}

export function securitySummary(snapshot = {}) {
  const posture = snapshot.posture || {};
  const compliance = snapshot.compliance || {};
  const lines = [
    'MERLIN SECURITY AND COMPLIANCE',
    `Posture: ${posture.score ?? 0}/100 (${posture.band || 'UNKNOWN'})`,
    `Compliance: ${compliance.score ?? 0}/100 (${compliance.band || 'UNKNOWN'})`,
    `Open risks: ${snapshot.risks?.filter(item => item.state !== 'CLOSED').length || 0}`,
    `Open incidents: ${snapshot.incidents?.filter(item => !['RESOLVED', 'CLOSED'].includes(item.state)).length || 0}`,
    `Open vulnerabilities: ${snapshot.vulnerabilities?.filter(item => item.state !== 'CLOSED').length || 0}`,
    `Evidence items: ${snapshot.evidence?.length || 0}`
  ];
  return `${lines.join('\n')}\n`;
}
