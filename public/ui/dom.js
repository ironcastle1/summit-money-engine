export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function text(selector, value, root = document) {
  const node = typeof selector === 'string' ? $(selector, root) : selector;
  if (node) node.textContent = value ?? '';
  return node;
}

export function html(selector, value, root = document) {
  const node = typeof selector === 'string' ? $(selector, root) : selector;
  if (node) node.innerHTML = value ?? '';
  return node;
}

export function setClass(node, className, enabled) {
  if (!node) return;
  node.classList.toggle(className, Boolean(enabled));
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}
