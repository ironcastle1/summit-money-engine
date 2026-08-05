export function createConnectionStatus(options = {}) {
  const banner = options.banner || createBanner();
  let timer = null;
  const render = state => {
    banner.dataset.state = state;
    banner.hidden = state === 'online';
    banner.textContent = state === 'offline' ? 'OFFLINE — SHOWING CACHED OR REFERENCE DATA' : state === 'recovering' ? 'CONNECTION RESTORED — REFRESHING SOURCES' : '';
  };
  const onOffline = () => render('offline');
  const onOnline = () => {
    render('recovering');
    clearTimeout(timer);
    timer = setTimeout(() => render('online'), 2500);
  };
  addEventListener('offline', onOffline);
  addEventListener('online', onOnline);
  render(navigator.onLine ? 'online' : 'offline');
  return Object.freeze({
    set: render,
    destroy() { removeEventListener('offline', onOffline); removeEventListener('online', onOnline); clearTimeout(timer); }
  });
}

function createBanner() {
  const banner = document.createElement('div');
  banner.id = 'connection-status';
  banner.className = 'connection-status';
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');
  banner.hidden = true;
  document.body.append(banner);
  return banner;
}
