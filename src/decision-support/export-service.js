function csv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function itemFields(item = {}) {
  const band = item.attention?.band || item.priority || item.type || item.status || '';
  const score = item.attention?.score ?? item.score ?? '';
  const title = item.title || item.headline || item.action || item.id || 'Item';
  const summary = item.summary || item.description || item.reason || item.note || '';
  return { band, score, title, summary };
}

export class DecisionSupportExportService {
  toJson(value) {
    return JSON.stringify(value, null, 2);
  }

  signalsCsv(signals = []) {
    const rows = [['id', 'domain', 'priority', 'score', 'confidence', 'title', 'summary', 'time', 'location', 'sources']];
    for (const signal of signals) {
      rows.push([
        signal.id,
        signal.domain,
        signal.attention?.band,
        signal.attention?.score,
        signal.attention?.confidence?.score,
        signal.title,
        signal.summary,
        signal.time,
        signal.location?.label,
        (signal.sources || []).join('|')
      ]);
    }
    return rows.map(row => row.map(csv).join(',')).join('\n');
  }

  reportMarkdown(report) {
    const lines = [
      `# ${report.title}`,
      '',
      `Generated: ${report.generatedAt}`,
      `Classification: ${report.classification || 'INTERNAL'}`,
      `Status: ${report.status || 'DRAFT'}`,
      '',
      '## Executive summary',
      '',
      report.executive?.headline || 'No headline'
    ];
    if (report.qualityGate?.warnings?.length) {
      lines.push('', '## Quality warnings', '');
      for (const warning of report.qualityGate.warnings) lines.push(`- ${warning}`);
    }
    for (const section of report.sections || []) {
      lines.push('', `## ${section.title}`, '');
      if (!(section.items || []).length) lines.push('_No items._');
      for (const item of section.items || []) {
        const fields = itemFields(item);
        const prefix = [fields.band, fields.score].filter(value => value !== '').join(' ');
        lines.push(`- ${prefix ? `**${prefix}** ` : ''}${fields.title}${fields.summary ? ` — ${fields.summary}` : ''}`);
      }
    }
    lines.push('', '## Recommendations', '');
    if (!(report.recommendations || []).length) lines.push('_No recommendations._');
    for (const item of report.recommendations || []) {
      lines.push(`- ${item.action} (${item.priority}, confidence ${item.confidence})`);
    }
    return lines.join('\n');
  }

  reportHtml(report) {
    const warnings = (report.qualityGate?.warnings || []).map(item => `<li>${escapeHtml(item)}</li>`).join('');
    const sections = (report.sections || []).map(section => {
      const items = (section.items || []).map(item => {
        const fields = itemFields(item);
        const prefix = [fields.band, fields.score].filter(value => value !== '').join(' ');
        return `<li>${prefix ? `<strong>${escapeHtml(prefix)}</strong> ` : ''}${escapeHtml(fields.title)}${fields.summary ? ` — ${escapeHtml(fields.summary)}` : ''}</li>`;
      }).join('');
      return `<section><h2>${escapeHtml(section.title)}</h2>${items ? `<ul>${items}</ul>` : '<p>No items.</p>'}</section>`;
    }).join('');
    const recommendations = (report.recommendations || []).map(item => `<li><strong>${escapeHtml(item.priority)}</strong> ${escapeHtml(item.action)}</li>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(report.title)}</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:980px;margin:40px auto;padding:0 24px;color:#17212b}header{border-bottom:2px solid #17212b;padding-bottom:16px}small{color:#53616e}.warning{background:#fff4d8;border:1px solid #d2a23d;padding:12px}section{margin:28px 0}li{margin:7px 0}@media print{body{margin:0;max-width:none}.warning{break-inside:avoid}}</style></head><body><header><small>${escapeHtml(report.type)} · ${escapeHtml(report.classification || 'INTERNAL')} · ${escapeHtml(report.status || 'DRAFT')}</small><h1>${escapeHtml(report.title)}</h1><p>${escapeHtml(report.generatedAt)}</p></header><h2>Executive summary</h2><p>${escapeHtml(report.executive?.headline || '')}</p>${warnings ? `<div class="warning"><h2>Quality warnings</h2><ul>${warnings}</ul></div>` : ''}${sections}<section><h2>Recommendations</h2>${recommendations ? `<ol>${recommendations}</ol>` : '<p>No recommendations.</p>'}</section></body></html>`;
  }
}
