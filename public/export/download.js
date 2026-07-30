function filenameSafe(value) {
  return String(value || 'export').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'export';
}

export function downloadBlob(filename, content, type = 'application/octet-stream') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function exportJson(name, value) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadBlob(`${filenameSafe(name)}-${stamp}.json`, `${JSON.stringify(value, null, 2)}\n`, 'application/json;charset=utf-8');
}

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function rowsToCsv(rows, columns) {
  const resolvedColumns = columns?.length ? columns : [...new Set(rows.flatMap(row => Object.keys(row || {})))];
  const lines = [resolvedColumns.map(csvCell).join(',')];
  for (const row of rows) lines.push(resolvedColumns.map(column => csvCell(row?.[column])).join(','));
  return `\ufeff${lines.join('\r\n')}\r\n`;
}

export function exportCsv(name, rows, columns) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadBlob(`${filenameSafe(name)}-${stamp}.csv`, rowsToCsv(rows, columns), 'text/csv;charset=utf-8');
}
