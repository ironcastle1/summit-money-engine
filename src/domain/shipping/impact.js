import { clamp, round, mean } from '../../core/numbers.js';
import { haversineKm } from '../geo/distance.js';
import { routeNearPoint } from './route-analysis.js';

export function analyseShippingImpactAtPoint(input) {
  const { point, radiusKm, ports, chokepoints, routes, riskById } = input;
  const nearbyPorts = ports.map(port => ({ ...port, distanceKm: haversineKm(point.lat, point.lon, port.coordinates.lat, port.coordinates.lon), risk: riskById.get(port.id) || null })).filter(item => item.distanceKm <= radiusKm).sort((a, b) => a.distanceKm - b.distanceKm);
  const nearbyChokepoints = chokepoints.map(item => ({ ...item, distanceKm: haversineKm(point.lat, point.lon, item.coordinates.lat, item.coordinates.lon), risk: riskById.get(item.id) || null })).filter(item => item.distanceKm <= radiusKm).sort((a, b) => a.distanceKm - b.distanceKm);
  const nearbyRoutes = routes.features.map(route => routeNearPoint(route, point, radiusKm)).filter(Boolean).sort((a, b) => a.distanceKm - b.distanceKm);
  const risks = [...nearbyPorts, ...nearbyChokepoints].map(item => item.risk?.score).filter(Number.isFinite);
  const score = risks.length ? round(clamp(mean(risks) + Math.min(20, nearbyRoutes.length * 2), 0, 100), 1) : null;
  return { point, radiusKm, score, confidence: risks.length ? round(clamp(35 + Math.log2(risks.length + 1) * 18, 0, 92), 1) : null, nearbyPorts, nearbyChokepoints, nearbyRoutes, evidenceCount: risks.length };
}
