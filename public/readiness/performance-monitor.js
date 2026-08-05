export function createPerformanceMonitor(options = {}) {
  const metrics = { interactiveMs: null, domNodes: 0, longTaskMs: 0, layoutShift: 0, visibleMarkers: 0 };
  const started = performance.now();
  const observers = [];
  try {
    const longTasks = new PerformanceObserver(list => { for (const entry of list.getEntries()) metrics.longTaskMs += entry.duration; });
    longTasks.observe({ type: 'longtask', buffered: true });
    observers.push(longTasks);
  } catch {}
  try {
    const shifts = new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) metrics.layoutShift += entry.value; });
    shifts.observe({ type: 'layout-shift', buffered: true });
    observers.push(shifts);
  } catch {}
  const sample = () => {
    metrics.domNodes = document.getElementsByTagName('*').length;
    metrics.visibleMarkers = document.querySelectorAll('[data-map-entity]').length;
    if (document.documentElement.dataset.bootstrap === 'ready' && metrics.interactiveMs === null) metrics.interactiveMs = Math.round(performance.now() - started);
    return { ...metrics, layoutShift: Number(metrics.layoutShift.toFixed(4)), longTaskMs: Math.round(metrics.longTaskMs) };
  };
  const interval = setInterval(() => options.onSample?.(sample()), options.intervalMs || 15000);
  return Object.freeze({ sample, destroy() { clearInterval(interval); observers.forEach(observer => observer.disconnect()); } });
}
