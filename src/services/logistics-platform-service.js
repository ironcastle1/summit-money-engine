import { LogisticsPlatform } from '../logistics/logistics-platform.js';
export function createLogisticsPlatformService(dependencies, options = {}) {
  return new LogisticsPlatform({ catalog: dependencies.shippingCatalog, shipping: dependencies.shippingIntelligence, events: dependencies.eventService, repository: options.repository, contextTtlMs: options.contextTtlMs });
}
