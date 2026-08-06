import { frozen } from './utilities.js';

export function sectionLayout(block, input = {}) {
  const density = String(input.density || 'STANDARD').toUpperCase();
  const columns = block.type === 'METRIC_GRID' ? 4 : ['EVENT_TABLE', 'MARKET_TABLE', 'COUNTRY_TABLE', 'ROUTE_TABLE'].includes(block.type) ? 1 : 1;
  return frozen({
    blockId: block.id,
    type: block.type,
    columns,
    density,
    pageBreakBefore: Boolean(block.pageBreakBefore),
    keepTogether: ['TITLE', 'EXECUTIVE_SUMMARY', 'METRIC_GRID'].includes(block.type)
  });
}
