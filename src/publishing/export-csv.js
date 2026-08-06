function quote(value) {
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export function editionBlocksCsv(edition) {
  const rows = [['edition_id', 'edition_number', 'block_id', 'type', 'title', 'text', 'source_ids']];
  for (const block of edition.blocks || []) {
    rows.push([edition.id, edition.editionNumber, block.id, block.type, block.title, block.text, (block.sourceIds || []).join('|')]);
  }
  return `${rows.map(row => row.map(quote).join(',')).join('\n')}\n`;
}
