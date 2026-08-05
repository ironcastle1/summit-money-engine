export function installErrorBoundary(options = {}) {
  const reports = [];
  const maximum = options.maximum || 30;
  const capture = (type, detail) => {
    const report = Object.freeze({ type, message: String(detail?.message || detail || 'Unknown client error'), stack: detail?.stack || null, view: document.documentElement.dataset.view || 'map', recordedAt: new Date().toISOString() });
    reports.unshift(report);
    reports.splice(maximum);
    document.documentElement.dataset.clientHealth = 'error';
    options.onError?.(report);
  };
  const onError = event => capture('error', event.error || event.message);
  const onRejection = event => capture('unhandledrejection', event.reason);
  addEventListener('error', onError);
  addEventListener('unhandledrejection', onRejection);
  return Object.freeze({
    reports: () => reports.slice(),
    clear() { reports.length = 0; document.documentElement.dataset.clientHealth = 'ok'; },
    destroy() { removeEventListener('error', onError); removeEventListener('unhandledrejection', onRejection); }
  });
}
