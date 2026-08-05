(() => {
  'use strict';

  const VIEW_LABELS = Object.freeze({
    map: ['GLOBAL OVERVIEW', 'Live intelligence map'],
    opportunities: ['ACTIONABLE SIGNALS', 'Opportunities'],
    markets: ['MARKET INTELLIGENCE', 'Markets and commodities'],
    conflict: ['SECURITY INTELLIGENCE', 'Conflict theatres'],
    places: ['COUNTRY INTELLIGENCE', 'Places and political risk'],
    'live-data': ['SOURCE OPERATIONS', 'Live data coverage'],
    briefings: ['DECISION SUPPORT', 'Briefings'],
    automation: ['WORKFLOW CONTROL', 'Automation'],
    publishing: ['CLIENT DELIVERY', 'Publishing'],
    commercial: ['CUSTOMER OPERATIONS', 'Customers'],
    security: ['ENTERPRISE CONTROL', 'Security and compliance'],
    operations: ['SERVICE RELIABILITY', 'Operations'],
    release: ['RELEASE CONTROL', 'Deployment readiness']
  });

  function byId(id) { return document.getElementById(id); }

  function updateContext(view) {
    const labels = VIEW_LABELS[view] || VIEW_LABELS.map;
    const kicker = byId('context-kicker');
    const title = byId('context-title');
    if (kicker) kicker.textContent = labels[0];
    if (title) title.textContent = labels[1];
    document.title = view === 'map' ? 'Merlin Intelligence' : `${labels[1]} · Merlin`;
  }

  function installNavigationContext() {
    document.querySelectorAll('.merlin-nav-item').forEach(button => {
      button.addEventListener('click', () => updateContext(button.dataset.view));
    });
    updateContext(document.querySelector('.merlin-nav-item.active')?.dataset.view || 'map');
  }

  function installMobileLayerAccess() {
    const layerDock = byId('layer-dock');
    const searchToggle = byId('map-search-toggle');
    if (!layerDock || !searchToggle) return;
    let longPress;
    searchToggle.addEventListener('pointerdown', () => {
      longPress = window.setTimeout(() => layerDock.classList.toggle('mobile-visible'), 650);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => searchToggle.addEventListener(type, () => window.clearTimeout(longPress)));
  }

  function installMapLoadingFailsafe() {
    const loading = byId('map-loading');
    if (!loading) return;
    const dismiss = () => {
      loading.style.opacity = '0';
      loading.style.pointerEvents = 'none';
      window.setTimeout(() => loading.remove(), 220);
    };
    window.setTimeout(dismiss, 2200);
    window.addEventListener('merlin:map-ready', dismiss, { once: true });
  }

  function installThemeMetaSync() {
    const meta = document.querySelector('meta[name="theme-color"]');
    const colours = { midnight: '#090d12', graphite: '#151617', forest: '#0a1511', crimson: '#160c0f', sand: '#e8e1d4', light: '#ffffff' };
    window.addEventListener('merlin:theme', event => {
      const theme = event.detail?.theme || 'midnight';
      if (meta) meta.content = colours[theme] || colours.midnight;
    });
  }

  function installPanelState() {
    const drawer = byId('map-drawer');
    if (!drawer) return;
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      root.dataset.drawer = drawer.classList.contains('closed') ? 'closed' : 'open';
    });
    observer.observe(drawer, { attributes: true, attributeFilter: ['class'] });
  }

  function installBrandGuard() {
    const image = document.querySelector('.merlin-brand-mark img');
    if (!image) return;
    image.addEventListener('error', () => {
      image.hidden = true;
      image.parentElement?.setAttribute('data-fallback', 'M');
    }, { once: true });
  }

  function start() {
    installNavigationContext();
    installMobileLayerAccess();
    installMapLoadingFailsafe();
    installThemeMetaSync();
    installPanelState();
    installBrandGuard();
    document.documentElement.dataset.aesthetic = 'v22';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
