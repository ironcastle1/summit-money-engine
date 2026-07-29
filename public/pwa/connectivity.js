export class ConnectivityController {
  constructor(options = {}) {
    this.onChange = options.onChange || (() => {});
    this.state = { online: navigator.onLine, effectiveType: navigator.connection?.effectiveType || 'N/A', downlink: navigator.connection?.downlink || null, rtt: navigator.connection?.rtt || null };
  }

  bind() {
    const update = () => {
      this.state = { online: navigator.onLine, effectiveType: navigator.connection?.effectiveType || 'N/A', downlink: navigator.connection?.downlink || null, rtt: navigator.connection?.rtt || null };
      document.documentElement.dataset.connectivity = this.state.online ? 'online' : 'offline';
      this.onChange({ ...this.state });
      window.dispatchEvent(new CustomEvent('summit:connectivity', { detail: this.state }));
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    navigator.connection?.addEventListener?.('change', update);
    update();
  }
}
