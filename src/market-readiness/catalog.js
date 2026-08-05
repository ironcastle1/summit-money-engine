export const DEVICE_MATRIX = Object.freeze([
  { id: 'mobile-small', label: 'Small mobile', width: 360, height: 740, touch: true, required: true },
  { id: 'mobile-large', label: 'Large mobile', width: 430, height: 932, touch: true, required: true },
  { id: 'tablet', label: 'Tablet', width: 820, height: 1180, touch: true, required: true },
  { id: 'laptop', label: 'Laptop', width: 1366, height: 768, touch: false, required: true },
  { id: 'desktop', label: 'Desktop', width: 1440, height: 900, touch: false, required: true },
  { id: 'ultrawide', label: 'Ultrawide', width: 1920, height: 1080, touch: false, required: true }
]);

export const BROWSER_MATRIX = Object.freeze([
  { id: 'chromium', label: 'Chrome / Chromium', required: true },
  { id: 'firefox', label: 'Firefox', required: true },
  { id: 'webkit', label: 'Safari / WebKit', required: true }
]);

export const CUSTOMER_JOURNEYS = Object.freeze([
  { id: 'first-run', title: 'First-run onboarding', required: true, steps: ['load-shell', 'dismiss-or-complete-tour', 'open-map', 'toggle-layer', 'open-event'] },
  { id: 'morning-brief', title: 'Morning intelligence brief', required: true, steps: ['open-briefings', 'inspect-priorities', 'open-evidence', 'save-view'] },
  { id: 'map-investigation', title: 'Map investigation', required: true, steps: ['search-location', 'inspect-result', 'change-time-window', 'open-detail'] },
  { id: 'route-exposure', title: 'Route exposure', required: true, steps: ['open-route-tool', 'select-origin-destination', 'calculate', 'compare-alternative'] },
  { id: 'market-opportunity', title: 'Market opportunity', required: true, steps: ['open-opportunities', 'filter-results', 'inspect-evidence', 'open-market-context'] },
  { id: 'automation', title: 'Monitoring automation', required: true, steps: ['open-automation', 'create-rule', 'validate-rule', 'inspect-run-history'] },
  { id: 'publish-report', title: 'Publish intelligence report', required: true, steps: ['open-publishing', 'create-edition', 'apply-redaction', 'create-secure-share'] },
  { id: 'offline-recovery', title: 'Offline and cached recovery', required: true, steps: ['simulate-offline', 'show-status', 'use-cached-data', 'recover-online'] },
  { id: 'keyboard-only', title: 'Keyboard-only navigation', required: true, steps: ['skip-to-content', 'navigate-primary', 'open-search', 'close-dialog'] },
  { id: 'subscription-gate', title: 'Plan and entitlement journey', required: true, steps: ['open-customers', 'inspect-plan', 'show-entitlement', 'show-upgrade-path'] }
]);

export const THEMES = Object.freeze([
  { id: 'midnight', label: 'Midnight', dark: true },
  { id: 'graphite', label: 'Graphite', dark: true },
  { id: 'forest', label: 'Forest', dark: true },
  { id: 'crimson', label: 'Crimson', dark: true },
  { id: 'sand', label: 'Sand', dark: false },
  { id: 'light', label: 'Light', dark: false }
]);

export const ACCEPTANCE_DOMAINS = Object.freeze([
  'startup', 'navigation', 'map', 'overlays', 'drawers', 'search', 'responsive', 'accessibility',
  'performance', 'offline', 'errors', 'authentication', 'entitlements', 'workspaces', 'exports', 'security'
]);
