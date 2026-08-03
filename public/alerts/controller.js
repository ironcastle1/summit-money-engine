import { $, escapeHtml, text } from '../ui/dom.js';
import { age, number, percent } from '../ui/format.js';
import { exportJson } from '../export/download.js';
import { AlertRepository } from './repository.js';

const FIELD_OPTIONS = Object.freeze({
  OPPORTUNITY: [
    ['score', 'SCORE'], ['confidence', 'CONFIDENCE'], ['risk', 'RISK'], ['probability', 'PROBABILITY'],
    ['expectedMove', 'EXPECTED MOVE'], ['liquidity', 'LIQUIDITY'], ['kind', 'KIND'], ['direction', 'DIRECTION'], ['evidenceGrade', 'EVIDENCE GRADE'], ['symbol', 'SYMBOL'], ['category', 'CATEGORY']
  ],
  NEWS: [
    ['urgencyScore', 'URGENCY'], ['verification.score', 'VERIFICATION'], ['verification.independentSources', 'SOURCE COUNT'],
    ['verification.averageReliability', 'SOURCE PRIOR'], ['burst.score', 'BURST'], ['burst.rateRatio', 'RATE RATIO'],
    ['claimAgreement.agreementPct', 'CLAIM AGREEMENT'], ['claimAgreement.conflictCount', 'CLAIM CONFLICTS'],
    ['articleCount', 'ARTICLE COUNT'], ['category', 'CATEGORY'], ['countries', 'COUNTRIES'], ['tickers', 'ASSETS']
  ]
});
const OPERATORS = Object.freeze(['GTE', 'GT', 'LTE', 'LT', 'EQ', 'NEQ', 'CONTAINS']);

function expectedValue(field, raw) {
  if (['score', 'confidence', 'risk', 'probability', 'expectedMove', 'liquidity', 'urgencyScore', 'verification.score', 'verification.independentSources', 'verification.averageReliability', 'burst.score', 'burst.rateRatio', 'claimAgreement.agreementPct', 'claimAgreement.conflictCount', 'articleCount'].includes(field)) return Number(raw);
  return String(raw || '').trim().toUpperCase();
}

function formatActual(value, field) {
  if (!Number.isFinite(value)) return String(value ?? 'N/A').toUpperCase();
  if (field === 'probability') return percent(value * 100, { digits: 0 });
  if (field === 'expectedMove') return percent(value * 100, { digits: 2, sign: true });
  return number(value, 1);
}

function defaultRules() {
  return [
    { name: 'EDGE 70+', scope: 'OPPORTUNITY', enabled: true, combinator: 'ALL', cooldownMinutes: 60, conditions: [{ field: 'score', operator: 'GTE', expected: 70 }], delivery: { browser: true, inApp: true, sound: false } },
    { name: 'CONFIDENCE 75+', scope: 'OPPORTUNITY', enabled: true, combinator: 'ALL', cooldownMinutes: 120, conditions: [{ field: 'confidence', operator: 'GTE', expected: 75 }, { field: 'score', operator: 'GTE', expected: 60 }], delivery: { browser: true, inApp: true, sound: false } },
    { name: 'NEWS VERIFY 75+', scope: 'NEWS', enabled: true, combinator: 'ALL', cooldownMinutes: 60, conditions: [{ field: 'verification.score', operator: 'GTE', expected: 75 }, { field: 'verification.independentSources', operator: 'GTE', expected: 2 }], delivery: { browser: true, inApp: true, sound: false } }
  ];
}

export class AlertController {
  constructor(options) {
    this.store = options.store;
    this.api = options.api;
    this.repository = new AlertRepository();
    this.initialized = false;
    this.evaluating = false;
  }

  bind() {
    this.populateOptions();
    $('#alert-scope')?.addEventListener('change', () => this.populateOptions());
    $('#alert-add')?.addEventListener('click', () => this.addRule());
    $('#alert-permission')?.addEventListener('click', () => this.requestPermission());
    $('#alert-clear-history')?.addEventListener('click', () => { this.repository.clearHistory(); this.renderHistory(); });
    $('#alert-export')?.addEventListener('click', () => exportJson('merlin-alerts', { rules: this.repository.rules(), history: this.repository.history(), exportedAt: new Date().toISOString() }));
    $('#alert-rule-list')?.addEventListener('click', event => this.handleRuleAction(event));
    window.addEventListener('merlin:opportunities-updated', event => this.evaluate(event.detail?.opportunities || [], 'OPPORTUNITY'));
    window.addEventListener('merlin:news-updated', event => this.evaluate(event.detail?.stories || [], 'NEWS'));
    if (!this.repository.rules().length) defaultRules().forEach(rule => this.repository.saveRule(rule));
    this.render();
  }

  async ensureInitialized() {
    if (!this.initialized) { this.initialized = true; this.bind(); }
    this.render();
  }

  populateOptions() {
    const field = $('#alert-field');
    const operator = $('#alert-operator');
    const scope = $('#alert-scope')?.value || 'OPPORTUNITY';
    if (field) field.innerHTML = (FIELD_OPTIONS[scope] || FIELD_OPTIONS.OPPORTUNITY).map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
    if (operator) operator.innerHTML = OPERATORS.map(value => `<option value="${value}">${value}</option>`).join('');
  }

  addRule() {
    const scope = $('#alert-scope')?.value || 'OPPORTUNITY';
    const field = $('#alert-field')?.value || (scope === 'NEWS' ? 'verification.score' : 'score');
    const operator = $('#alert-operator')?.value || 'GTE';
    const raw = $('#alert-value')?.value;
    const expected = expectedValue(field, raw);
    if ((typeof expected === 'number' && !Number.isFinite(expected)) || expected === '') { text('#alert-status', 'INVALID VALUE'); return; }
    const name = String($('#alert-name')?.value || `${field} ${operator} ${raw}`).trim().slice(0, 80);
    this.repository.saveRule({
      name,
      scope,
      enabled: true,
      combinator: 'ALL',
      cooldownMinutes: Number($('#alert-cooldown')?.value) || 60,
      conditions: [{ field, operator, expected }],
      delivery: { browser: true, inApp: true, sound: false }
    });
    if ($('#alert-name')) $('#alert-name').value = '';
    if ($('#alert-value')) $('#alert-value').value = '';
    text('#alert-status', 'RULE ADDED');
    this.renderRules();
  }

  handleRuleAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    if (button.dataset.action === 'toggle') this.repository.toggleRule(button.dataset.id);
    if (button.dataset.action === 'delete') this.repository.removeRule(button.dataset.id);
    this.renderRules();
  }

  async requestPermission() {
    if (!('Notification' in window)) { text('#alert-permission-state', 'UNSUPPORTED'); return; }
    const result = await Notification.requestPermission();
    text('#alert-permission-state', result.toUpperCase());
  }

  async evaluate(targets, scope = 'OPPORTUNITY') {
    if (this.evaluating || !targets.length) return;
    const rules = this.repository.rules().filter(rule => rule.enabled && rule.scope === scope);
    if (!rules.length) return;
    this.evaluating = true;
    try {
      const result = await this.api.evaluateAlerts({ rules, targets }, { timeoutMs: 15_000 });
      const matches = (result.matches || []).map(match => ({ ...match, id: `${match.rule.id}:${match.targetId}:${match.triggeredAt}` }));
      if (matches.length) {
        this.repository.addMatches(matches);
        this.deliver(matches);
        this.renderHistory();
      }
      text('#alert-last-check', `${result.evaluatedTargets || 0} / ${matches.length}`);
    } catch (error) { text('#alert-last-check', `${error.code || 'ERROR'}`); }
    finally { this.evaluating = false; }
  }

  deliver(matches) {
    const browserAllowed = 'Notification' in window && Notification.permission === 'granted';
    for (const match of matches.slice(0, 5)) {
      if (browserAllowed && match.rule?.delivery?.browser !== false) {
        const target = match.target || {};
        new Notification(match.rule.name, { body: `${target.title || target.symbol || match.targetId} / ${Number.isFinite(target.score) ? target.score.toFixed(1) : Number.isFinite(target.urgencyScore) ? target.urgencyScore.toFixed(1) : 'N/A'}`, tag: `${match.rule.id}:${match.targetId}` });
      }
    }
  }

  render() {
    text('#alert-permission-state', 'Notification' in window ? Notification.permission.toUpperCase() : 'UNSUPPORTED');
    this.renderRules();
    this.renderHistory();
  }

  renderRules() {
    const root = $('#alert-rule-list');
    if (!root) return;
    const rules = this.repository.rules();
    text('#alert-rule-count', String(rules.length));
    text('#alert-enabled-count', String(rules.filter(rule => rule.enabled).length));
    root.innerHTML = rules.length ? rules.map(rule => `
      <article class="alert-rule ${rule.enabled ? 'enabled' : 'disabled'}">
        <button type="button" data-action="toggle" data-id="${escapeHtml(rule.id)}"><i></i><span><strong>${escapeHtml(rule.name)}</strong><small>${escapeHtml(rule.scope)} / ${rule.conditions.map(condition => `${condition.field.toUpperCase()} ${condition.operator} ${condition.expected}`).join(' + ')} / ${rule.cooldownMinutes}M</small></span></button>
        <button type="button" data-action="delete" data-id="${escapeHtml(rule.id)}">×</button>
      </article>`).join('') : '<div class="empty-state">0 RULES</div>';
  }

  renderHistory() {
    const root = $('#alert-history');
    if (!root) return;
    const history = this.repository.history();
    text('#alert-history-count', String(history.length));
    root.innerHTML = history.length ? history.slice(0, 100).map(item => {
      const target = item.target || {};
      const condition = item.conditions?.[0] || {};
      return `<article class="alert-history-row"><span><strong>${escapeHtml(item.rule?.name || 'ALERT')}</strong><small>${escapeHtml(target.title || target.symbol || item.targetId)}</small></span><b>${escapeHtml(formatActual(condition.actual, condition.field))}</b><time>${age(item.triggeredAt)}</time></article>`;
    }).join('') : '<div class="empty-state">0 TRIGGERS</div>';
  }
}
