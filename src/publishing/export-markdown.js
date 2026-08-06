function valueText(value) {
  if (Array.isArray(value)) {
    return value.map(item => `- ${typeof item === 'object' ? item.title || item.name || JSON.stringify(item) : item}`).join('\n');
  }
  if (value && typeof value === 'object') {
    return `\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
  }
  return String(value ?? '');
}

export function editionMarkdown(edition) {
  const lines = [`# ${edition.title}`, '', `**Classification:** ${edition.classification}`, `**Edition:** ${edition.editionNumber}`, edition.subtitle || '', ''];
  for (const block of edition.blocks || []) {
    if (block.title) lines.push(`## ${block.title}`, '');
    if (block.subtitle) lines.push(`_${block.subtitle}_`, '');
    if (block.text) lines.push(block.text, '');
    else lines.push(valueText(block.data?.items || block.data), '');
  }
  return `${lines.join('\n').trim()}\n`;
}
