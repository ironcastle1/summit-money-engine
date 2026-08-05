import { printCss } from './print-css.js';

function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function renderData(value) {
  if (Array.isArray(value)) return `<ul>${value.slice(0, 200).map(item => `<li>${escape(typeof item === 'object' ? item.title || item.name || JSON.stringify(item) : item)}</li>`).join('')}</ul>`;
  if (value && typeof value === 'object') return `<pre>${escape(JSON.stringify(value, null, 2))}</pre>`;
  return escape(value);
}

function renderBlock(block) {
  const className = `block block-${String(block.type || 'text').toLowerCase()}${block.pageBreakBefore ? ' page-break' : ''}`;
  const heading = block.title ? `<h2>${escape(block.title)}</h2>` : '';
  const subtitle = block.subtitle ? `<p class="meta">${escape(block.subtitle)}</p>` : '';
  const body = block.text ? `<p>${escape(block.text).replaceAll('\n', '<br>')}</p>` : renderData(block.data?.items || block.data);
  return `<section class="${className}">${heading}${subtitle}${body}</section>`;
}

export function editionHtml(edition, options = {}) {
  const brand = options.brand || {};
  const watermark = options.watermark?.text ? `<div class="watermark">${escape(options.watermark.text)}</div>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(edition.title)}</title><style>${printCss(brand)}</style></head><body>${watermark}<main class="report"><header><div class="classification">${escape(edition.classification)}</div><h1>${escape(edition.title)}</h1><p>${escape(edition.subtitle || '')}</p><p class="meta">Edition ${escape(edition.editionNumber)} · ${escape(edition.period || edition.createdAt || '')}</p></header>${(edition.blocks || []).map(renderBlock).join('')}<footer class="meta">${escape(brand.footer || 'Prepared by Merlin Intelligence')}</footer></main></body></html>`;
}
