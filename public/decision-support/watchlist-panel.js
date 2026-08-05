import { escapeHtml, number } from './format.js';
const STORAGE = 'merlin.decision-watches.v20';
function read() { try { return JSON.parse(localStorage.getItem(STORAGE) || '[]'); } catch { return []; } }
function write(items) { localStorage.setItem(STORAGE, JSON.stringify(items)); }
export class WatchlistPanel {
  constructor(root, onChange) { this.root = root; this.onChange = onChange; }
  list() { return read(); }
  add(input) { const item = { id: `watch-${Date.now()}`, label: String(input.label || 'Watch'), terms: String(input.terms || '').split(',').map(value => value.trim()).filter(Boolean), domains: input.domains || [], minimumPriority: Number(input.minimumPriority || 60), enabled: true }; const items = [item, ...read()].slice(0, 100); write(items); this.render(); this.onChange?.(items); return item; }
  remove(id) { const items = read().filter(item => item.id !== id); write(items); this.render(); this.onChange?.(items); }
  render() { const items = read(); this.root.innerHTML = `<div class="watch-form"><input data-watch-label placeholder="WATCH NAME"><input data-watch-terms placeholder="TERMS, COMMA SEPARATED"><input data-watch-score type="number" min="0" max="100" value="60"><button data-watch-add>ADD WATCH</button></div><div class="watch-list">${items.map(item => `<article><div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.terms.join(', ') || 'ALL SIGNALS')}</span></div><b>${number(item.minimumPriority)}</b><button data-watch-remove="${escapeHtml(item.id)}">×</button></article>`).join('') || '<div class="decision-empty">0 WATCHLIST RULES</div>'}</div>`; this.root.querySelector('[data-watch-add]')?.addEventListener('click', () => this.add({ label: this.root.querySelector('[data-watch-label]').value, terms: this.root.querySelector('[data-watch-terms]').value, minimumPriority: this.root.querySelector('[data-watch-score]').value })); this.root.querySelectorAll('[data-watch-remove]').forEach(button => button.addEventListener('click', () => this.remove(button.dataset.watchRemove))); }
}
