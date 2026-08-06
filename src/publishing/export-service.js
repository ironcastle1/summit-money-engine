import { editionBlocksCsv } from './export-csv.js';
import { editionHtml } from './export-html.js';
import { editionJson } from './export-json.js';
import { editionMarkdown } from './export-markdown.js';

export class PublishingExportService {
  render(edition, format = 'HTML', options = {}) {
    const type = String(format || 'HTML').toUpperCase();
    if (type === 'HTML' || type === 'PRINT_HTML') return { contentType: 'text/html; charset=utf-8', body: editionHtml(edition, options), extension: 'html' };
    if (type === 'MARKDOWN' || type === 'MD') return { contentType: 'text/markdown; charset=utf-8', body: editionMarkdown(edition), extension: 'md' };
    if (type === 'CSV') return { contentType: 'text/csv; charset=utf-8', body: editionBlocksCsv(edition), extension: 'csv' };
    if (type === 'JSON') return { contentType: 'application/json; charset=utf-8', body: editionJson(edition, options), extension: 'json' };
    throw new TypeError(`Unsupported publication export format: ${type}`);
  }
}
