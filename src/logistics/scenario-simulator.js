import { planAlternatives } from './alternative-router.js';
import { compareRoutes } from './route-comparison.js';
import { propagateDisruption } from './disruption-propagation.js';
export function simulateScenario(platform, scenario = {}) {
  const graph = platform.graph.clone(); const closedNodes = new Set((scenario.closedNodeIds || []).map(value => String(value).toLowerCase()));
  const closedEdges = new Set((scenario.closedRouteIds || []).map(value => String(value).toLowerCase()));
  const request = Object.freeze({ ...scenario.request, avoidNodeIds: [...new Set([...(scenario.request?.avoidNodeIds || []), ...closedNodes])], avoidRouteIds: [...new Set([...(scenario.request?.avoidRouteIds || []), ...closedEdges])] });
  const routes = planAlternatives(graph, request, platform.context({ ...scenario.context, scenario }));
  const propagation = propagateDisruption(graph, [...closedNodes], { maximumDepth: scenario.maximumPropagationDepth || 4, seedScore: scenario.seedScore || 100 });
  return Object.freeze({ id: String(scenario.id || `scenario-${Date.now()}`), name: String(scenario.name || 'Untitled scenario'), request, closures: Object.freeze({ nodeIds: [...closedNodes], routeIds: [...closedEdges] }), routes: Object.freeze(routes), comparison: compareRoutes(routes), propagation, generatedAt: new Date().toISOString() });
}
