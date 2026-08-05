import { $, $$, escapeHtml, text } from '../ui/dom.js';
import { age, number, percent } from '../ui/format.js';
import { renderTimelineChart } from './timeline-chart.js';
import { renderNewsSourceStrip } from './source-strip.js';
import { SavedNewsSearches } from './saved-searches.js';

const DEFAULT_SOURCE_QUERY = '(conflict OR earthquake OR flood OR wildfire OR storm OR energy OR shipping OR sanctions OR election OR cyber OR inflation OR markets)';

function stateClass(state) {
  return String(state || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function score(value) { return Number.isFinite(value) ? String(Math.round(value)) : 'N/A'; }
function list(value, maximum = 5) { return Array.isArray(value) && value.length ? value.slice(0, maximum).join(' · ') : 'N/A'; }

function safeHref(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '#'; } catch { return '#'; }
}

function renderRankList(container, items, suffix = '') {
  if (!container) return;
  const maximum = Math.max(1, ...(items || []).map(item => item.count));
  container.innerHTML = (items || []).slice(0, 10).map(item => `<div class="news-rank-row"><span>${escapeHtml(item.name)}</span><i><b style="width:${Math.round(item.count / maximum * 100)}%"></b></i><strong>${number(item.count)}${suffix}</strong></div>`).join('') || '<div class="news-empty">0 DATA</div>';
}

function storyRow(story, selected) {
  const acceleration = Number.isFinite(story.velocity?.accelerationPct) ? percent(story.velocity.accelerationPct, { sign: true }) : 'N/A';
  return `<button class="news-story-row ${selected ? 'selected' : ''}" type="button" data-story-id="${escapeHtml(story.id)}">
    <span class="news-story-score">${score(story.urgencyScore)}</span>
    <span class="news-story-main"><strong>${escapeHtml(story.title)}</strong><small>${escapeHtml(story.category.toUpperCase())} · ${story.articleCount} ARTICLES · ${age(story.publishedAt)}</small></span>
    <span class="news-story-verify ${stateClass(story.verification.state)}"><b>${score(story.verification.score)}</b><small>${escapeHtml(story.verification.state)}</small></span>
    <span class="news-story-velocity"><b>${number(story.velocity.recentPerHour, 1)}/H</b><small>${acceleration}</small></span>
  </button>`;
}

function sourceRow(source) {
  return `<a class="news-evidence-row" href="${escapeHtml(safeHref(source.url))}" target="_blank" rel="noopener noreferrer">
    <span><strong>${escapeHtml(source.name || source.domain || 'SOURCE')}</strong><small>${escapeHtml(source.domain || source.type)}</small></span>
    <b>${score(source.reliability)}</b><time>${age(source.publishedAt)}</time>
  </a>`;
}

function impactRow(impact) {
  return `<div class="news-impact-row ${stateClass(impact.direction)}"><strong>${escapeHtml(impact.symbol)}</strong><span>${escapeHtml(impact.direction)}</span><b>${score(impact.confidence)}</b><small>${impact.horizonHours}H</small></div>`;
}


function claimRow(claim, conflicts = new Set()) {
  const flagged = conflicts.has(claim.id);
  const value = claim.values?.[0];
  const numeric = value ? Number(value.value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A';
  return `<div class="news-claim-row ${flagged ? 'conflict' : ''}">
    <span><strong>${escapeHtml(claim.subject)}</strong><small>${escapeHtml(claim.sentence)}</small></span>
    <b>${escapeHtml(claim.metric)}</b><i>${escapeHtml(claim.direction)}</i><em>${numeric}</em><mark>${score(claim.confidence)}</mark>
  </div>`;
}

function eventRow(event) {
  return `<div class="news-event-link"><span><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(event.source)} · ${age(event.time)}</small></span><b>${score(event.confidence)}</b></div>`;
}

export class NewsController {
  constructor(options) {
    this.api = options.api;
    this.store = options.store;
    this.initialized = false;
    this.loading = false;
    this.payload = null;
    this.selectedId = null;
    this.abortController = null;
    this.savedSearches = new SavedNewsSearches();
    this.activeSavedSearchId = null;
  }

  bind() {
    $('#news-refresh')?.addEventListener('click', () => this.load());
    $('#news-search')?.addEventListener('keydown', event => { if (event.key === 'Enter') this.load(); });
    $('#news-hours')?.addEventListener('change', () => this.load());
    $('#news-source-type')?.addEventListener('change', () => this.load());
    $('#news-min-verification')?.addEventListener('change', () => this.load());
    $('#news-sort')?.addEventListener('change', () => this.load());
    $('#news-save-search')?.addEventListener('click', () => this.saveSearch());
    $('#news-delete-search')?.addEventListener('click', () => this.deleteSearch());
    $('#news-saved-search')?.addEventListener('change', event => this.applySavedSearch(event.target.value));
    $('#news-story-rows')?.addEventListener('click', event => {
      const row = event.target.closest('[data-story-id]');
      if (!row) return;
      this.selectedId = row.dataset.storyId;
      this.renderStories();
      this.renderDetail();
    });
    $('#news-category-bars')?.addEventListener('click', event => {
      const row = event.target.closest('[data-news-category]');
      if (!row) return;
      $('#news-search').value = row.dataset.newsCategory;
      this.load();
    });
  }

  async ensureInitialized() {
    if (this.initialized) return;
    this.initialized = true;
    this.bind();
    this.renderSavedSearches();
    await this.loadPreload();
    void this.load({ background: true });
  }



  async loadPreload() {
    try {
      const payload = await this.api.news(this.parameters());
      this.applyPayload(payload);
    } catch {}
  }

  applyPayload(payload) {
    if (!payload) return;
    this.payload = payload;
    if (!payload.stories?.some(story => story.id === this.selectedId)) this.selectedId = payload.stories?.[0]?.id || null;
    this.render();
    window.dispatchEvent(new CustomEvent('merlin:news-updated', { detail: { stories: payload.stories || [] } }));
  }

  currentSearchDefinition() {
    return {
      id: this.activeSavedSearchId || undefined,
      name: $('#news-search')?.value.trim() || `NEWS ${$('#news-hours')?.value || 24}H`,
      query: $('#news-search')?.value.trim() || '',
      hours: Number($('#news-hours')?.value || 24),
      sourceType: $('#news-source-type')?.value || '',
      minimumVerification: Number($('#news-min-verification')?.value || 0),
      sort: $('#news-sort')?.value || 'latest'
    };
  }

  saveSearch() {
    const saved = this.savedSearches.save(this.currentSearchDefinition());
    this.activeSavedSearchId = saved.id;
    this.renderSavedSearches();
  }

  deleteSearch() {
    if (!this.activeSavedSearchId) return;
    this.savedSearches.remove(this.activeSavedSearchId);
    this.activeSavedSearchId = null;
    this.renderSavedSearches();
  }

  applySavedSearch(id) {
    const saved = this.savedSearches.get(id);
    this.activeSavedSearchId = saved?.id || null;
    if (!saved) return;
    $('#news-search').value = saved.query;
    $('#news-hours').value = String(saved.hours);
    $('#news-source-type').value = saved.sourceType;
    $('#news-min-verification').value = String(saved.minimumVerification);
    $('#news-sort').value = saved.sort;
    this.savedSearches.recordRun(saved.id);
    this.load();
  }

  renderSavedSearches() {
    const select = $('#news-saved-search');
    if (!select) return;
    const searches = this.savedSearches.list();
    select.innerHTML = `<option value="">${searches.length} SAVED</option>${searches.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${item.hours}H · ${item.minimumVerification}</option>`).join('')}`;
    select.value = this.activeSavedSearchId || '';
  }

  parameters() {
    const sourceType = $('#news-source-type')?.value || '';
    return {
      q: $('#news-search')?.value.trim() || '',
      sourceQuery: $('#news-search')?.value.trim() || DEFAULT_SOURCE_QUERY,
      hours: Number($('#news-hours')?.value || 24),
      sourceTypes: sourceType ? [sourceType] : [],
      minimumVerification: Number($('#news-min-verification')?.value || 0),
      sort: $('#news-sort')?.value || 'latest',
      limit: 100,
      sourceLimit: 125,
      includeEventLinks: true
    };
  }

  setLoading(value) {
    this.loading = value;
    const button = $('#news-refresh');
    if (button) { button.disabled = value; button.textContent = value ? '...' : 'REFRESH'; }
    $('#news-workspace')?.classList.toggle('loading', value);
  }

  async load({ background = false } = {}) {
    if (this.loading) this.abortController?.abort();
    this.abortController = new AbortController();
    if (!background) this.setLoading(true);
    text('#news-error', '');
    $('#news-error')?.classList.add('hidden');
    try {
      const payload = await this.api.newsLive(this.parameters(), { signal: this.abortController.signal, timeoutMs: 8_000 });
      this.applyPayload(payload);
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (!this.payload) { text('#news-error', `${error.code || 'NEWS_ERROR'} / ${error.message}`); $('#news-error')?.classList.remove('hidden'); }
    } finally { if (!background) this.setLoading(false); }
  }

  render() {
    const analytics = this.payload?.analytics || {};
    text('#news-article-count', number(analytics.articleCount || 0));
    text('#news-story-count', number(analytics.storyCount || 0));
    text('#news-source-count', number(analytics.sourceCount || 0));
    text('#news-news-count', number(analytics.newsCount || 0));
    text('#news-social-count', number(analytics.socialCount || 0));
    text('#news-velocity-index', score(analytics.velocityIndex));
    text('#news-corroborated', percent(analytics.coverage?.corroboratedPct));
    text('#news-supported', percent(analytics.coverage?.supportedPct));
    text('#news-single-source', percent(analytics.coverage?.singleSourcePct));
    text('#news-mean-verification', score(analytics.coverage?.meanVerification));
    text('#news-mean-sources', number(analytics.coverage?.meanSourceCount, 1));
    text('#news-source-diversity', score(analytics.provenance?.sourceDiversityScore));
    text('#news-source-concentration', percent(analytics.provenance?.largestSourceSharePct));
    text('#news-updated', age(this.payload?.generatedAt));
    renderNewsSourceStrip($('#news-source-strip'), this.payload?.sources || {});
    renderTimelineChart($('#news-timeline'), analytics.timeline);
    renderRankList($('#news-category-bars'), analytics.categories);
    renderRankList($('#news-country-bars'), analytics.countries);
    renderRankList($('#news-ticker-bars'), analytics.tickers);
    this.decorateCategoryRows();
    this.renderStories();
    this.renderDetail();
  }

  decorateCategoryRows() {
    $$('#news-category-bars .news-rank-row').forEach(row => {
      row.dataset.newsCategory = row.querySelector('span')?.textContent || '';
      row.setAttribute('role', 'button');
      row.tabIndex = 0;
    });
  }

  renderStories() {
    const container = $('#news-story-rows');
    if (!container) return;
    const stories = this.payload?.stories || [];
    container.innerHTML = stories.map(story => storyRow(story, story.id === this.selectedId)).join('') || '<div class="news-empty">0 STORIES</div>';
  }

  renderDetail() {
    const story = this.payload?.stories?.find(item => item.id === this.selectedId);
    if (!story) {
      text('#news-detail-title', 'NO SELECTION');
      text('#news-detail-category', 'N/A');
      return;
    }
    text('#news-detail-title', story.title);
    text('#news-detail-category', story.category.toUpperCase());
    text('#news-detail-urgency', score(story.urgencyScore));
    text('#news-detail-verification', score(story.verification.score));
    text('#news-detail-state', story.verification.state);
    text('#news-detail-source-count', number(story.verification.independentSources));
    text('#news-detail-rated-count', number(story.verification.ratedSources));
    text('#news-detail-reliability', score(story.verification.averageReliability));
    text('#news-detail-article-count', number(story.articleCount));
    text('#news-detail-rate', `${number(story.velocity.recentPerHour, 1)}/H`);
    text('#news-detail-acceleration', Number.isFinite(story.velocity.accelerationPct) ? percent(story.velocity.accelerationPct, { sign: true }) : 'N/A');
    text('#news-detail-age', age(story.publishedAt));
    text('#news-detail-burst', score(story.burst?.score));
    text('#news-detail-rate-ratio', number(story.burst?.rateRatio, 2));
    text('#news-detail-claims', number(story.claimAgreement?.claimCount || 0));
    text('#news-detail-conflicts', number(story.claimAgreement?.conflictCount || 0));
    text('#news-detail-agreement', percent(story.claimAgreement?.agreementPct));
    text('#news-detail-comparisons', number(story.claimAgreement?.comparisonCount || 0));
    text('#news-detail-burst-z', number(story.burst?.zScore, 2));
    text('#news-detail-burst-state', story.burst?.state || 'N/A');
    text('#news-detail-countries', list(story.countries, 8));
    text('#news-detail-entities', list(story.entities, 8));
    text('#news-detail-keywords', list(story.keywords, 10));
    text('#news-detail-tickers', list(story.tickers, 10));
    const conflictClaims = new Set((story.claimAgreement?.conflicts || []).flatMap(item => [item.leftClaimId, item.rightClaimId]));
    $('#news-claim-list').innerHTML = story.claims.map(claim => claimRow(claim, conflictClaims)).join('') || '<div class="news-empty">0 CLAIMS</div>';
    $('#news-evidence-list').innerHTML = story.sources.map(sourceRow).join('') || '<div class="news-empty">0 SOURCES</div>';
    $('#news-impact-list').innerHTML = story.impacts.map(impactRow).join('') || '<div class="news-empty">0 ASSET LINKS</div>';
    $('#news-event-links').innerHTML = story.eventLinks.map(eventRow).join('') || '<div class="news-empty">0 EVENT LINKS</div>';
  }
}
