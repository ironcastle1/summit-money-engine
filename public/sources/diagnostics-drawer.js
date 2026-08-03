import { $, escapeHtml } from '../ui/dom.js';
import { number, upper } from '../ui/format.js';

function sourceStateClass(state) { return `state-${String(state || 'offline').toLowerCase()}`; }

function sourceRows(sources, countKey = 'recordCount') {
  return Object.values(sources || {}).map(source => `
    <div class="diagnostic-row">
      <span>${escapeHtml(source.name || source.id)}</span>
      <b class="${sourceStateClass(source.state)}">${escapeHtml(upper(source.state))}</b>
      <b>${number(source[countKey] ?? source.requestCount)}</b>
    </div>`).join('') || '<div class="empty-state">0 SOURCES</div>';
}

export class DiagnosticsDrawer {
  constructor(options) { this.api = options.api; this.drawer = $('#diagnostics-drawer'); this.content = $('#diagnostics-content'); }
  bind() {
    $('#diagnostics-toggle').addEventListener('click', () => this.open());
    $('#diagnostics-close').addEventListener('click', () => this.close());
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && this.drawer.classList.contains('open')) this.close(); });
  }
  async open() {
    this.drawer.classList.add('open'); this.drawer.setAttribute('aria-hidden', 'false'); this.content.innerHTML = '<div class="empty-state">LOADING</div>';
    try { this.render(await this.api.diagnostics()); }
    catch (error) { this.content.innerHTML = `<div class="empty-state">${escapeHtml(error.code || 'ERROR')}</div>`; }
  }
  close() { this.drawer.classList.remove('open'); this.drawer.setAttribute('aria-hidden', 'true'); }
  render(data) {
    this.content.innerHTML = `
      <section class="diagnostic-summary">
        <article class="diagnostic-tile"><span>VERSION</span><strong>${escapeHtml(data.version)}</strong></article>
        <article class="diagnostic-tile"><span>UPTIME</span><strong>${number(data.uptimeSeconds)}S</strong></article>
        <article class="diagnostic-tile"><span>RSS</span><strong>${number(data.memoryMb?.rss)}MB</strong></article>
        <article class="diagnostic-tile"><span>CACHE</span><strong>${number(data.cache?.entries)}</strong></article>
        <article class="diagnostic-tile"><span>HITS</span><strong>${number(data.cache?.hits)}</strong></article>
        <article class="diagnostic-tile"><span>ROUTES</span><strong>${number(data.routes?.length)}</strong></article>
      </section>
      <section class="diagnostic-section"><h3>EVENT SOURCES</h3>${sourceRows(data.eventSources || data.sources)}</section>
      <section class="diagnostic-section"><h3>MARKET SOURCES</h3>${sourceRows(data.marketSources, 'requestCount')}</section>
      <section class="diagnostic-section"><h3>CACHE</h3>${Object.entries(data.cache || {}).map(([key, value]) => `<div class="diagnostic-row"><span>${escapeHtml(upper(key))}</span><b>${number(value)}</b><b></b></div>`).join('')}</section>
      <section class="diagnostic-section"><h3>MEMORY MB</h3>${Object.entries(data.memoryMb || {}).map(([key, value]) => `<div class="diagnostic-row"><span>${escapeHtml(upper(key))}</span><b>${number(value)}</b><b></b></div>`).join('')}</section>`;
  }
}
