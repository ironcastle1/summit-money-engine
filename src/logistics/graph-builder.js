import { RouteGraph } from './route-graph.js';
import { normalizeSegment, reverseSegment } from './route-segment.js';
import { haversineKm } from './geo.js';
function nodeFromPort(port) { return { id: port.id, name: port.name, kind: 'PORT', coordinates: port.coordinates, importance: port.importance, country: port.country, countryCode: port.countryCode, region: port.region, commodities: port.commodities || [], metadata: { type: port.type, unlocode: port.unlocode, routeIds: port.routeIds || [] } }; }
function nodeFromChokepoint(item) { return { id: item.id, name: item.name, kind: 'CHOKEPOINT', coordinates: item.coordinates, importance: item.importance, country: item.country || '', countryCode: item.countryCode || '', region: item.region || '', commodities: item.commodities || [], metadata: { radiusKm: item.radiusKm, routeIds: item.routeIds || [], alternateRouteIds: item.alternateRouteIds || [] } }; }
function endpoint(feature, index) { const coordinates = feature.geometry?.coordinates || []; const value = coordinates[index < 0 ? coordinates.length + index : index]; return value ? { lon: Number(value[0]), lat: Number(value[1]) } : null; }
function nearestNode(point, nodes, maximumKm = 1200) {
  if (!point) return null;
  const ranked = nodes.map(node => ({ node, distanceKm: haversineKm(point, node.coordinates) })).sort((a, b) => a.distanceKm - b.distanceKm);
  return ranked[0]?.distanceKm <= maximumKm ? ranked[0] : null;
}
function syntheticEndpoint(routeId, side, point) { return { id: `${routeId}-${side}`, name: `${routeId} ${side}`, kind: 'WAYPOINT', coordinates: point, importance: 30, country: '', countryCode: '', region: '', commodities: [], metadata: { synthetic: true } }; }
export function buildRouteGraph(catalog, options = {}) {
  const graph = new RouteGraph();
  const ports = (catalog.ports || []).map(nodeFromPort); const chokepoints = (catalog.chokepoints || []).map(nodeFromChokepoint);
  const baseNodes = [...ports, ...chokepoints];
  for (const node of baseNodes) graph.addNode(node);
  for (const feature of catalog.routes?.features || []) {
    const properties = feature.properties || {}; const id = String(properties.id || '').toLowerCase();
    const startPoint = endpoint(feature, 0); const endPoint = endpoint(feature, -1);
    let start = nearestNode(startPoint, baseNodes, options.maximumEndpointDistanceKm || 1500)?.node;
    let end = nearestNode(endPoint, baseNodes, options.maximumEndpointDistanceKm || 1500)?.node;
    if (!start && startPoint) { start = syntheticEndpoint(id, 'origin', startPoint); graph.addNode(start); }
    if (!end && endPoint) { end = syntheticEndpoint(id, 'destination', endPoint); graph.addNode(end); }
    if (!start || !end || start.id === end.id) continue;
    const segment = normalizeSegment({ ...feature, id, name: properties.name, from: start.id, to: end.id, mode: properties.class === 'air' ? 'AIR' : 'SEA', importance: properties.importance, commodity: properties.commodity, restrictions: properties.restrictions || {}, metadata: { sourceRouteId: id } });
    graph.addEdge(segment);
    if (properties.oneWay !== true) graph.addEdge(reverseSegment(segment));
  }
  const connectorIds = new Set();
  for (const node of [...ports, ...chokepoints]) {
    for (const routeId of node.metadata.routeIds || []) {
      const edge = graph.edge(routeId); if (!edge) continue;
      if (edge.from !== node.id && edge.to !== node.id) {
        const target = haversineKm(node.coordinates, graph.node(edge.from).coordinates) <= haversineKm(node.coordinates, graph.node(edge.to).coordinates) ? edge.from : edge.to;
        const connectorId = `connector:${node.id}:${target}`;
        if (connectorIds.has(connectorId)) continue;
        connectorIds.add(connectorId);
        const connector = normalizeSegment({ id: connectorId, name: `${node.name} connector`, from: node.id, to: target, mode: 'SEA', importance: node.importance, commodity: 'mixed', coordinates: [[node.coordinates.lon, node.coordinates.lat], [graph.node(target).coordinates.lon, graph.node(target).coordinates.lat]], metadata: { connector: true, nodeKind: node.kind } });
        graph.addEdge(connector); graph.addEdge(reverseSegment(connector));
      }
    }
  }
  return graph;
}
