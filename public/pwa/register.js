export class PwaController {
  constructor(options = {}) {
    this.onState = options.onState || (() => {});
    this.registration = null;
    this.deferredPrompt = null;
  }

  async register() {
    if (!('serviceWorker' in navigator)) {
      this.onState({ supported: false, state: 'UNSUPPORTED' });
      return null;
    }
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      this.bindRegistration(this.registration);
      window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        this.deferredPrompt = event;
        this.onState({ supported: true, installable: true, state: 'INSTALLABLE' });
      });
      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null;
        this.onState({ supported: true, installed: true, state: 'INSTALLED' });
      });
      this.onState({ supported: true, state: this.registration.active ? 'ACTIVE' : 'REGISTERED' });
      return this.registration;
    } catch (error) {
      this.onState({ supported: true, state: 'ERROR', error });
      return null;
    }
  }

  bindRegistration(registration) {
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) this.onState({ supported: true, updateAvailable: true, state: 'UPDATE_READY' });
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => this.onState({ supported: true, state: 'UPDATED' }));
  }

  async install() {
    if (!this.deferredPrompt) return { outcome: 'unavailable' };
    await this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    return choice;
  }

  async applyUpdate() {
    const waiting = this.registration?.waiting;
    if (!waiting) return false;
    waiting.postMessage({ type: 'SKIP_WAITING' });
    return true;
  }
}
