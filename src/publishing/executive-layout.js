import { sectionLayout } from './section-layout.js';
import { frozen } from './utilities.js';

export function executiveLayout(edition, input = {}) {
  const pageSize = String(input.pageSize || 'A4').toUpperCase();
  const orientation = String(input.orientation || 'PORTRAIT').toUpperCase();
  return frozen({
    pageSize,
    orientation,
    margin: input.margin || '18mm',
    header: input.header !== false,
    footer: input.footer !== false,
    sections: Object.freeze((edition.blocks || []).map(block => sectionLayout(block, input)))
  });
}
