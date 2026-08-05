import { createMarketReadinessController } from './controller.js';

export function installMarketReadinessSystem(options = {}) {
  const controller = createMarketReadinessController({
    onPerformance: metrics => {
      if (!options.reportMetrics) return;
      options.reportMetrics(metrics).catch?.(() => {});
    },
    onClientError: report => options.onClientError?.(report)
  });
  window.merlinMarketReadiness = controller;
  return controller;
}
