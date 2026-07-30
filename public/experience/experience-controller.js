import { CommandPalette } from './command-palette.js';
import { createCommandRegistry } from './command-registry.js';
import {
  DEFAULT_PREFERENCES,
  cycleSoundMode,
  effectiveMotionMode,
  loadPreferences,
  savePreferences
} from './preferences.js';
import { SoundEngine } from './sound-engine.js';

const VIEW_SHORTCUTS = Object.freeze({
  '1': 'map', '2': 'news', '3': 'shipping', '4': 'intelligence', '5': 'opportunities',
  '6': 'markets', '7': 'replay', '8': 'predictions', '9': 'alerts', '0': 'ops'
});

function interactiveTarget(target) {
  return target?.closest?.('input, textarea, select, [contenteditable="true"]');
}

function percentValue(text) {
  const match = String(text || '').match(/(-?\d+(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : null;
}

function numericValue(text) {
  const match = String(text || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function semanticClass(element) {
  const id = element.id.toLowerCase();
  const text = element.textContent.trim().toUpperCase();
  if (!text || text === 'N/A' || text === '--' || text === 'OFF' || text === 'NOT_CONFIGURED') return 'value-neutral';
  if (/ERROR|OFFLINE|FAILED|SEVERE|CRITICAL|SUSPENDED/.test(text)) return 'value-bad';
  if (/DEGRADED|WARNING|ELEVATED|PENDING/.test(text)) return 'value-warn';
  if (/ONLINE|READY|HEALTHY|ACTIVE|SUCCESS|LIVE/.test(text)) return 'value-good';
  const percent = percentValue(text);
  const value = numericValue(text);
  if (id.includes('error-rate') || id.includes('downside') || id.includes('risk') || id.includes('drawdown')) {
    if (value === null) return 'value-neutral';
    if (value >= 70) return 'value-bad';
    if (value >= 40) return 'value-warn';
    return 'value-good';
  }
  if (id.includes('confidence') || id.includes('coverage') || id.includes('quality') || id.includes('verify') || id.includes('probability')) {
    const compared = percent ?? value;
    if (compared === null) return 'value-neutral';
    if (compared >= 70) return 'value-good';
    if (compared >= 40) return 'value-warn';
    return 'value-bad';
  }
  return 'value-neutral';
}

export class ExperienceController {
  constructor({ switchView } = {}) {
    this.switchView = switchView;
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.activeRequests = 0;
    this.fetchPatched = false;
    this.toastTimer = null;
    this.lastMetricSoundAt = 0;
  }

  bind() {
    this.preferences = loadPreferences();
    this.sound = new SoundEngine({ mode: this.preferences.soundMode, volume: this.preferences.volume });
    this.palette = new CommandPalette({
      commands: createCommandRegistry(),
      sound: this.sound,
      onExecute: command => this.#executeCommand(command)
    });
    this.palette.bind();
    this.#applyPreferences();
    this.#bindPreferenceControls();
    this.#bindAudioUnlock();
    this.#bindInteractionAudio();
    this.#bindShortcuts();
    this.#bindCursorLight();
    this.#bindApplicationEvents();
    this.#bindMetricObserver();
    this.#bindAlertObserver();
    this.#patchFetch();
    this.#decorateExistingValues();
    document.documentElement.classList.add('experience-ready');
  }

  play(name, options) { return this.sound?.play(name, options); }

  toast(message, { tone = 'neutral', duration = 3200 } = {}) {
    const root = document.querySelector('#experience-toast');
    if (!root) return;
    root.className = `experience-toast tone-${tone}`;
    root.querySelector('strong').textContent = String(message);
    root.classList.add('visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => root.classList.remove('visible'), duration);
  }

  setSoundMode(mode, { preview = true } = {}) {
    this.preferences.soundMode = String(mode).toUpperCase();
    this.sound.setMode(this.preferences.soundMode);
    this.#saveAndApply();
    if (preview && this.preferences.soundMode !== 'OFF') this.sound.preview();
    this.toast(`SOUND ${this.preferences.soundMode}`, { tone: this.preferences.soundMode === 'OFF' ? 'neutral' : 'good' });
  }

  cycleSound() { this.setSoundMode(cycleSoundMode(this.preferences.soundMode)); }

  toggleDensity() {
    this.preferences.density = this.preferences.density === 'COMPACT' ? 'COMFORTABLE' : 'COMPACT';
    this.#saveAndApply();
    this.sound.play('INTERACT');
    this.toast(`${this.preferences.density} DENSITY`);
  }

  toggleMotion() {
    this.preferences.motionMode = effectiveMotionMode(this.preferences) === 'REDUCED' ? 'FULL' : 'REDUCED';
    this.#saveAndApply();
    this.sound.play('INTERACT');
    this.toast(`${this.preferences.motionMode} MOTION`);
  }

  openPreferences() {
    const panel = document.querySelector('#experience-panel');
    panel?.classList.add('open');
    panel?.setAttribute('aria-hidden', 'false');
    document.querySelector('#experience-backdrop')?.classList.add('visible');
    this.sound.play('OPEN');
  }

  closePreferences() {
    const panel = document.querySelector('#experience-panel');
    panel?.classList.remove('open');
    panel?.setAttribute('aria-hidden', 'true');
    document.querySelector('#experience-backdrop')?.classList.remove('visible');
    this.sound.play('CLOSE');
  }

  #saveAndApply() {
    this.preferences = savePreferences(this.preferences);
    this.sound.setMode(this.preferences.soundMode);
    this.sound.setVolume(this.preferences.volume);
    this.#applyPreferences();
  }

  #applyPreferences() {
    const root = document.documentElement;
    root.dataset.sound = this.preferences.soundMode.toLowerCase();
    root.dataset.motion = effectiveMotionMode(this.preferences).toLowerCase();
    root.dataset.density = this.preferences.density.toLowerCase();
    root.dataset.ambient = this.preferences.ambientGlow ? 'on' : 'off';
    root.dataset.cursorLight = this.preferences.cursorLight ? 'on' : 'off';
    root.dataset.metricAnimation = this.preferences.metricAnimation ? 'on' : 'off';
    document.querySelector('#sound-toggle')?.setAttribute('data-mode', this.preferences.soundMode);
    const soundLabel = document.querySelector('#sound-mode-label');
    if (soundLabel) soundLabel.textContent = this.preferences.soundMode;
    const soundButton = document.querySelector('#sound-toggle');
    if (soundButton) {
      soundButton.title = `Sound: ${this.preferences.soundMode}`;
      soundButton.setAttribute('aria-label', `Sound mode ${this.preferences.soundMode}. Activate to change.`);
    }
    document.querySelectorAll('[data-sound-mode]').forEach(button => button.classList.toggle('active', button.dataset.soundMode === this.preferences.soundMode));
    const volume = document.querySelector('#experience-volume');
    if (volume) volume.value = String(Math.round(this.preferences.volume * 100));
    const volumeValue = document.querySelector('#experience-volume-value');
    if (volumeValue) volumeValue.textContent = `${Math.round(this.preferences.volume * 100)}%`;
    const density = document.querySelector('#experience-density');
    if (density) density.textContent = this.preferences.density;
    const motion = document.querySelector('#experience-motion');
    if (motion) motion.textContent = effectiveMotionMode(this.preferences);
    for (const [id, key] of [['experience-ambient', 'ambientGlow'], ['experience-cursor', 'cursorLight'], ['experience-metrics', 'metricAnimation']]) {
      const button = document.querySelector(`#${id}`);
      if (button) {
        button.dataset.active = String(this.preferences[key]);
        button.textContent = this.preferences[key] ? 'ON' : 'OFF';
      }
    }
  }

  #bindPreferenceControls() {
    document.querySelector('#sound-toggle')?.addEventListener('click', () => this.cycleSound());
    document.querySelector('#experience-toggle')?.addEventListener('click', () => this.openPreferences());
    document.querySelector('#experience-close')?.addEventListener('click', () => this.closePreferences());
    document.querySelector('#experience-backdrop')?.addEventListener('click', () => this.closePreferences());
    document.querySelectorAll('[data-sound-mode]').forEach(button => button.addEventListener('click', () => this.setSoundMode(button.dataset.soundMode)));
    document.querySelector('#experience-volume')?.addEventListener('input', event => {
      this.preferences.volume = Number(event.target.value) / 100;
      this.#saveAndApply();
    });
    document.querySelector('#experience-volume')?.addEventListener('change', () => this.sound.preview());
    document.querySelector('#experience-density')?.addEventListener('click', () => this.toggleDensity());
    document.querySelector('#experience-motion')?.addEventListener('click', () => this.toggleMotion());
    for (const [id, key] of [['experience-ambient', 'ambientGlow'], ['experience-cursor', 'cursorLight'], ['experience-metrics', 'metricAnimation']]) {
      document.querySelector(`#${id}`)?.addEventListener('click', () => {
        this.preferences[key] = !this.preferences[key];
        this.#saveAndApply();
        this.sound.play('INTERACT');
      });
    }
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.querySelector('#experience-panel')?.classList.contains('open')) this.closePreferences();
    });
  }

  #bindAudioUnlock() {
    const unlock = () => this.sound.unlock();
    document.addEventListener('pointerdown', unlock, { once: true, passive: true });
    document.addEventListener('keydown', unlock, { once: true, passive: true });
  }

  #bindInteractionAudio() {
    document.addEventListener('click', event => {
      const target = event.target.closest('button, [role="button"], .event-row, .market-row, .news-story-row, .shipping-row, .intelligence-row, .opportunity-row');
      if (!target || target.disabled || target.closest('#command-palette')) return;
      if (target.matches('.nav-item')) this.sound.play('NAVIGATE');
      else if (!target.matches('#sound-toggle, #experience-toggle, #experience-close')) this.sound.play('INTERACT', { level: 0.45 });
    }, { capture: true });
  }

  #bindShortcuts() {
    document.addEventListener('keydown', event => {
      if (interactiveTarget(event.target) || this.palette.opened) return;
      if (event.altKey && VIEW_SHORTCUTS[event.key]) {
        event.preventDefault();
        this.switchView?.(VIEW_SHORTCUTS[event.key]);
      } else if (event.altKey && event.key.toLowerCase() === 'a') {
        event.preventDefault(); this.switchView?.('account');
      } else if (event.key.toLowerCase() === 'm' && !event.ctrlKey && !event.metaKey) {
        this.cycleSound();
      }
    });
  }

  #bindCursorLight() {
    let scheduled = false;
    let latest = { x: innerWidth / 2, y: innerHeight / 2 };
    document.addEventListener('pointermove', event => {
      latest = { x: event.clientX, y: event.clientY };
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        document.documentElement.style.setProperty('--cursor-x', `${latest.x}px`);
        document.documentElement.style.setProperty('--cursor-y', `${latest.y}px`);
      });
    }, { passive: true });
  }

  #bindApplicationEvents() {
    window.addEventListener('summit:news-updated', event => {
      const stories = event.detail?.stories?.length || 0;
      if (stories) this.sound.play('DATA_UPDATE', { level: 0.65 });
    });
    window.addEventListener('summit:opportunities-updated', event => {
      const opportunities = event.detail?.opportunities || [];
      if (opportunities.some(item => Number(item.score) >= 80)) this.sound.play('WARNING');
      else if (opportunities.length) this.sound.play('SCAN_COMPLETE', { level: 0.72 });
    });
    window.addEventListener('summit:connectivity', event => {
      if (event.detail?.online) {
        this.toast('CONNECTION RESTORED', { tone: 'good' });
        this.sound.play('SUCCESS', { level: 0.65 });
      } else {
        this.toast('OFFLINE / CACHED DATA', { tone: 'warn', duration: 5000 });
        this.sound.play('WARNING');
      }
    });
    window.addEventListener('error', () => this.sound.play('ERROR', { level: 0.5 }));
    window.addEventListener('unhandledrejection', () => this.sound.play('ERROR', { level: 0.5 }));
  }

  #bindMetricObserver() {
    const observer = new MutationObserver(records => {
      const targets = new Set(records.map(record => record.target.nodeType === Node.TEXT_NODE ? record.target.parentElement : record.target));
      for (const target of targets) {
        const value = target?.matches?.('strong, b') ? target : target?.closest?.('strong, b');
        if (!value || !value.closest('.metric, .market-summary, .news-metrics, .shipping-metrics, .intelligence-metrics, .opportunity-summary, .ops-summary, .account-identity')) continue;
        this.#decorateValue(value, true);
      }
    });
    observer.observe(document.body, { subtree: true, characterData: true, childList: true });
    this.metricObserver = observer;
  }

  #decorateExistingValues() {
    document.querySelectorAll('.metric strong, .market-summary strong, .news-metrics strong, .shipping-metrics strong, .intelligence-metrics strong, .opportunity-summary strong, .ops-summary strong, .account-identity strong').forEach(value => this.#decorateValue(value, false));
  }

  #decorateValue(value, animate) {
    value.classList.remove('value-good', 'value-warn', 'value-bad', 'value-neutral');
    value.classList.add(semanticClass(value));
    if (animate && this.preferences.metricAnimation) {
      value.classList.remove('metric-flash');
      void value.offsetWidth;
      value.classList.add('metric-flash');
    }
  }

  #bindAlertObserver() {
    const history = document.querySelector('#alert-history');
    if (!history) return;
    let previousCount = history.children.length;
    const observer = new MutationObserver(() => {
      const count = history.children.length;
      if (count <= previousCount) { previousCount = count; return; }
      previousCount = count;
      const newest = history.firstElementChild?.textContent?.toUpperCase() || '';
      this.sound.play(/CRITICAL|SEVERE|90|100/.test(newest) ? 'CRITICAL' : 'WARNING');
      document.body.classList.add('alert-pulse');
      setTimeout(() => document.body.classList.remove('alert-pulse'), 900);
    });
    observer.observe(history, { childList: true });
    this.alertObserver = observer;
  }

  #patchFetch() {
    if (this.fetchPatched || typeof window.fetch !== 'function') return;
    this.fetchPatched = true;
    const original = window.fetch.bind(window);
    window.fetch = async (...args) => {
      this.activeRequests += 1;
      this.#renderNetworkProgress();
      try { return await original(...args); }
      finally {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        this.#renderNetworkProgress();
      }
    };
  }

  #renderNetworkProgress() {
    const bar = document.querySelector('#network-progress');
    if (!bar) return;
    bar.classList.toggle('active', this.activeRequests > 0);
    bar.style.setProperty('--request-count', String(Math.min(6, this.activeRequests)));
  }

  #executeCommand(command) {
    if (command.type === 'view') {
      this.switchView?.(command.view);
      return;
    }
    if (command.id === 'action:refresh') {
      const active = document.querySelector('[data-app-view]:not(.hidden)');
      const refresh = active?.querySelector('.action-button[id*="refresh"], #refresh-button, #opportunity-refresh, #market-refresh, #news-refresh, #shipping-refresh, #intelligence-refresh, #ops-refresh');
      refresh?.click();
    } else if (command.id === 'action:search') {
      this.switchView?.('map');
      setTimeout(() => document.querySelector('#place-search')?.focus(), 0);
    } else if (command.id === 'action:workspaces') document.querySelector('#workspace-toggle')?.click();
    else if (command.id === 'action:diagnostics') document.querySelector('#diagnostics-toggle')?.click();
    else if (command.id === 'action:sound') this.cycleSound();
    else if (command.id === 'action:density') this.toggleDensity();
    else if (command.id === 'action:motion') this.toggleMotion();
  }
}
