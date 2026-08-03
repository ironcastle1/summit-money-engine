import { $, setClass } from './dom.js';

let timer;
export function showMapMessage(message, options = {}) {
  const node = $('#map-message');
  clearTimeout(timer);
  node.textContent = message;
  setClass(node, 'hidden', false);
  timer = setTimeout(() => setClass(node, 'hidden', true), options.duration || 4500);
}
