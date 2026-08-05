import { executiveLayout } from './executive-layout.js';
import { editionHtml } from './export-html.js';
import { editionMarkdown } from './export-markdown.js';
import { publicationQualityGate } from './quality-gate.js';
import { frozen } from './utilities.js';

export function buildPublicationPreview(edition, options = {}) {
  const quality = publicationQualityGate(edition, options);
  return frozen({
    edition,
    quality,
    layout: executiveLayout(edition, options),
    html: editionHtml(edition, options),
    markdown: editionMarkdown(edition),
    generatedAt: new Date().toISOString()
  });
}
