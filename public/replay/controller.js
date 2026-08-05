import { $, escapeHtml, text } from '../ui/dom.js';
import { age, number, percent } from '../ui/format.js';
import { exportCsv, exportJson } from '../export/download.js';
import { renderEquityChart } from './equity-chart.js';

function ratio(value, digits = 2) { return Number.isFinite(value) ? number(value, digits) : 'N/A'; }
function pct(value, digits = 1) { return Number.isFinite(value) ? percent(value * 100, { digits, sign: value !== 0 }) : 'N/A'; }
function money(value) { return Number.isFinite(value) ? Number(value).toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }) : 'N/A'; }

export class ReplayController {
  constructor(options) {
    this.store = options.store;
    this.api = options.api;
    this.initialized = false;
    this.loading = false;
    this.abortController = null;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      this.initialized = true;
      this.bind();
      await this.loadCatalog();
      this.restoreControls();
    }
  }

  bind() {
    $('#replay-run')?.addEventListener('click', () => this.run());
    $('#replay-export-json')?.addEventListener('click', () => exportJson('merlin-replay', this.store.getState().replayResult || {}));
    $('#replay-export-csv')?.addEventListener('click', () => exportCsv('merlin-replay-trades', this.store.getState().replayResult?.trades || [], [
      'id', 'direction', 'signalStrength', 'entryAt', 'entryPrice', 'stopPrice', 'targetPrice', 'exitAt', 'exitPrice', 'exitReason', 'barsHeld', 'quantity', 'grossPnl', 'fees', 'pnl', 'returnOnCapital', 'rMultiple'
    ]));
    const inputs = ['replay-asset', 'replay-timeframe', 'replay-strategy', 'replay-capital', 'replay-risk', 'replay-fee', 'replay-slippage', 'replay-stop', 'replay-target', 'replay-holding', 'replay-fold-count', 'replay-short'];
    for (const id of inputs) $(`#${id}`)?.addEventListener('change', () => this.saveSettings());
    window.addEventListener('merlin:workspace-restored', () => this.restoreControls());
  }

  async loadCatalog() {
    try {
      const payload = await this.api.marketCatalog({});
      const assets = payload.assets || [];
      this.store.setState({ marketCatalog: assets }, 'replay.catalog_loaded');
      const select = $('#replay-asset');
      if (select) select.innerHTML = assets.map(asset => `<option value="${escapeHtml(asset.id)}">${escapeHtml(asset.symbol)} / ${escapeHtml(asset.name)}</option>`).join('');
    } catch (error) { text('#replay-error', `${error.code || 'CATALOG_ERROR'} / ${error.message}`); }
  }

  settings() {
    return {
      asset: 'btc-usd', timeframe: '1h', strategy: 'TREND_PULLBACK', capital: 10000,
      risk: 1, fee: 0.1, slippage: 0.05, stopAtr: 1.8, targetAtr: 3,
      holdingBars: 48, folds: 4, allowShort: true,
      ...(this.store.getState().replaySettings || {})
    };
  }

  saveSettings() {
    const replaySettings = {
      asset: $('#replay-asset')?.value || 'btc-usd',
      timeframe: $('#replay-timeframe')?.value || '1h',
      strategy: $('#replay-strategy')?.value || 'TREND_PULLBACK',
      capital: Number($('#replay-capital')?.value) || 10000,
      risk: Number($('#replay-risk')?.value) || 1,
      fee: Number($('#replay-fee')?.value) || 0.1,
      slippage: Number($('#replay-slippage')?.value) || 0.05,
      stopAtr: Number($('#replay-stop')?.value) || 1.8,
      targetAtr: Number($('#replay-target')?.value) || 3,
      holdingBars: Number($('#replay-holding')?.value) || 48,
      folds: Number($('#replay-fold-count')?.value) || 4,
      allowShort: $('#replay-short')?.checked !== false
    };
    this.store.setState({ replaySettings }, 'replay.settings_changed');
    return replaySettings;
  }

  restoreControls() {
    const settings = this.settings();
    const values = {
      'replay-asset': settings.asset, 'replay-timeframe': settings.timeframe, 'replay-strategy': settings.strategy,
      'replay-capital': settings.capital, 'replay-risk': settings.risk, 'replay-fee': settings.fee,
      'replay-slippage': settings.slippage, 'replay-stop': settings.stopAtr, 'replay-target': settings.targetAtr,
      'replay-holding': settings.holdingBars, 'replay-fold-count': settings.folds
    };
    for (const [id, value] of Object.entries(values)) if ($(`#${id}`)) $(`#${id}`).value = String(value);
    if ($('#replay-short')) $('#replay-short').checked = settings.allowShort;
  }

  async run() {
    if (this.loading) this.abortController?.abort();
    this.abortController = new AbortController();
    const settings = this.saveSettings();
    this.loading = true;
    this.setLoading(true);
    try {
      const result = await this.api.marketReplay({
        asset: settings.asset,
        timeframe: settings.timeframe,
        strategy: settings.strategy,
        capital: settings.capital,
        risk: settings.risk / 100,
        fee: settings.fee / 100,
        slippage: settings.slippage / 100,
        stopAtr: settings.stopAtr,
        targetAtr: settings.targetAtr,
        holdingBars: settings.holdingBars,
        folds: settings.folds,
        allowShort: settings.allowShort,
        limit: 1000
      }, { signal: this.abortController.signal, timeoutMs: 45_000 });
      this.store.setState({ replayResult: result }, 'replay.completed');
      this.render(result);
    } catch (error) {
      text('#replay-error', `${error.code || 'REPLAY_ERROR'} / ${error.message}`);
      $('#replay-error')?.classList.remove('hidden');
    } finally { this.loading = false; this.setLoading(false); }
  }

  setLoading(value) {
    const button = $('#replay-run');
    if (button) { button.disabled = value; button.textContent = value ? '...' : 'RUN'; }
  }

  render(result) {
    $('#replay-error')?.classList.add('hidden');
    if (!result?.available) {
      text('#replay-error', `${result?.reason || 'N/A'} / ${result?.candleCount || 0}`);
      $('#replay-error')?.classList.remove('hidden');
      return;
    }
    const metrics = result.metrics || {};
    text('#replay-title', `${result.asset?.symbol || 'N/A'} / ${result.timeframe.toUpperCase()} / ${result.config.strategyId}`);
    text('#replay-updated', `${age(result.generatedAt)} AGO`);
    text('#replay-total-return', pct(metrics.totalReturn));
    text('#replay-ending-capital', money(metrics.endingCapital));
    text('#replay-max-drawdown', pct(metrics.maximumDrawdown));
    text('#replay-win-rate', pct(metrics.winRate));
    text('#replay-profit-factor', ratio(metrics.profitFactor, 2));
    text('#replay-expectancy', money(metrics.expectancy));
    text('#replay-sharpe', ratio(metrics.sharpe, 2));
    text('#replay-sortino', ratio(metrics.sortino, 2));
    text('#replay-trade-count', number(metrics.tradeCount || 0));
    text('#replay-fees', money(metrics.feesPaid));
    text('#replay-recovery', ratio(metrics.recoveryFactor, 2));
    text('#replay-streak', `${metrics.longestWinStreak || 0} / ${metrics.longestLossStreak || 0}`);
    text('#replay-walk-consistency', pct(result.walkForward?.consistency));
    text('#replay-profitable-folds', `${result.walkForward?.profitableFolds || 0}/${result.walkForward?.foldCount || 0}`);
    renderEquityChart($('#replay-equity-chart'), result.equity || []);
    this.renderTrades(result.trades || []);
    this.renderFolds(result.walkForward?.folds || []);
  }

  renderTrades(trades) {
    const root = $('#replay-trades');
    if (!root) return;
    root.innerHTML = trades.length ? [...trades].reverse().slice(0, 100).map(trade => `<div class="replay-trade-row ${trade.pnl >= 0 ? 'win' : 'loss'}"><span>${escapeHtml(trade.direction)}</span><span>${escapeHtml(trade.entryAt.slice(0, 16).replace('T', ' '))}</span><span>${escapeHtml(trade.exitReason)}</span><strong>${money(trade.pnl)}</strong><b>${ratio(trade.rMultiple, 2)}R</b></div>`).join('') : '<div class="empty-state">0 TRADES</div>';
  }

  renderFolds(folds) {
    const root = $('#replay-folds');
    if (!root) return;
    root.innerHTML = folds.length ? folds.map(fold => `<div class="replay-fold-row"><span>F${fold.fold}</span><span>${fold.startAt?.slice(0, 10) || 'N/A'}</span><strong>${pct(fold.metrics?.totalReturn)}</strong><b>${pct(fold.metrics?.maximumDrawdown)}</b><em>${pct(fold.metrics?.winRate)}</em></div>`).join('') : '<div class="empty-state">0 FOLDS</div>';
  }
}
