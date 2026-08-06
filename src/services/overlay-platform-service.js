import { OverlayCatalog } from '../overlays/catalog.js';
import { DEFAULT_OVERLAYS } from '../overlays/default-catalog.js';
import { OverlaySourcePolicy } from '../overlays/source-policy.js';
import { OverlayQueryPlanner } from '../overlays/query-planner.js';
import { OverlayProviderRegistry } from '../overlays/provider-registry.js';
import { installDefaultOverlayProviders } from '../overlays/default-providers.js';
import { OverlayMetrics } from '../overlays/metrics.js';
import { OverlaySummaryService } from '../overlays/summary-service.js';
import { OverlayPlatform } from '../overlays/overlay-platform.js';
import { OverlayPresetService } from '../overlays/preset-service.js';
import { OverlayStateService } from '../overlays/state-service.js';
import { MemoryOverlayStateRepository } from '../overlays/repositories.js';
import { OverlayExportService } from '../overlays/export-service.js';
import { overlayAvailabilitySnapshot } from '../overlays/availability.js';
export function createOverlayPlatformService(services, options={}){
  const catalog=new OverlayCatalog(DEFAULT_OVERLAYS);
  const providers=installDefaultOverlayProviders(new OverlayProviderRegistry(),services);
  const sourcePolicy=new OverlaySourcePolicy({connectors:providers.list(),tiles:['*'],...(options.sourcePolicy||{})});
  const planner=new OverlayQueryPlanner({catalog,sourcePolicy});
  const metrics=new OverlayMetrics();
  const summary=new OverlaySummaryService();
  const platform=new OverlayPlatform({catalog,providers,sourcePolicy,planner,metrics,summary});
  const state=new OverlayStateService({catalog,repository:options.repository||new MemoryOverlayStateRepository()});
  const presets=new OverlayPresetService(catalog);
  const exporter=new OverlayExportService();
  return Object.freeze({catalog,providers,sourcePolicy,planner,metrics,summary,platform,state,presets,exporter,availability:()=>overlayAvailabilitySnapshot(catalog,sourcePolicy)});
}
