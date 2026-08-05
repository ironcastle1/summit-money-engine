import { deepGet } from './utilities.js';
const TOKEN = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;

export function personalizeText(template, context = {}) {
  return String(template ?? '').replace(TOKEN, (_match, path) => {
    const value = deepGet(context, path, '');
    return value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
  });
}

export function personalizeEdition(edition, subscriber) {
  const context = { subscriber, edition };
  return {
    ...edition,
    title: personalizeText(edition.title, context),
    subtitle: personalizeText(edition.subtitle, context),
    blocks: (edition.blocks || []).map(block => ({ ...block, title: personalizeText(block.title, context), subtitle: personalizeText(block.subtitle, context), text: personalizeText(block.text, context) }))
  };
}
