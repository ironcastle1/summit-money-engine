import { CONTENT_BLOCK_TYPES } from './constants.js';
import { makePublishingId } from './ids.js';
import { clean, frozen } from './utilities.js';

export function contentBlockRecord(input = {}, index = 0) {
  const type = String(input.type || 'TEXT').toUpperCase();
  if (!CONTENT_BLOCK_TYPES.includes(type)) throw new TypeError(`Unsupported content block type: ${type}`);
  return frozen({
    id: clean(input.id, 190) || makePublishingId('block', `${type}-${index + 1}`),
    type,
    title: clean(input.title, 240),
    subtitle: clean(input.subtitle, 500),
    data: frozen(input.data && typeof input.data === 'object' ? { ...input.data } : {}),
    text: String(input.text ?? '').slice(0, 100000),
    order: Number.isFinite(Number(input.order)) ? Number(input.order) : index,
    pageBreakBefore: Boolean(input.pageBreakBefore),
    visibility: frozen({ ...(input.visibility || {}) }),
    sourceIds: Object.freeze([...(input.sourceIds || [])].map(String).slice(0, 500))
  });
}
