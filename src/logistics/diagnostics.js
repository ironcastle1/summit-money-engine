export function logisticsDiagnostics(platform) {
  const graph = platform.graph.snapshot(); return Object.freeze({ status: graph.nodeCount > 0 && graph.edgeCount > 0 ? 'READY' : 'DEGRADED', graph: Object.freeze({ nodeCount: graph.nodeCount, edgeCount: graph.edgeCount, ports: graph.nodes.filter(node => node.kind === 'PORT').length, chokepoints: graph.nodes.filter(node => node.kind === 'CHOKEPOINT').length, waypoints: graph.nodes.filter(node => node.kind === 'WAYPOINT').length }), savedRoutes: platform.repository.routes?.size ?? null, generatedAt: new Date().toISOString() });
}
