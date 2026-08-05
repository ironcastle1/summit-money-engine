import { pointToSegmentKm } from './geo.js';
import { combineRiskComponents } from './risk-band.js';
import { clamp, round } from './numbers.js';
function eventPoint(event) { const lat = Number(event.lat ?? event.latitude ?? event.geometry?.coordinates?.[1]); const lon = Number(event.lon ?? event.longitude ?? event.geometry?.coordinates?.[0]); return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null; }
function segmentDistance(event, edge) {
  const point = eventPoint(event); if (!point) return Infinity; const coordinates = edge.coordinates || [];
  let distance = Infinity; for (let index = 1; index < coordinates.length; index += 1) distance = Math.min(distance, pointToSegmentKm(point, { lon: coordinates[index - 1][0], lat: coordinates[index - 1][1] }, { lon: coordinates[index][0], lat: coordinates[index][1] }));
  return distance;
}
export function routeExposure(edges, context = {}) {
  const widthKm = Math.max(10, Number(context.corridorWidthKm || 180)); const events = [];
  for (const event of context.events || []) {
    let nearest = null;
    for (const edge of edges) { const distanceKm = segmentDistance(event, edge); if (distanceKm <= widthKm && (!nearest || distanceKm < nearest.distanceKm)) nearest = { edgeId: edge.id, distanceKm }; }
    if (!nearest) continue;
    const severity = clamp(Number(event.severity ?? event.score ?? 0), 0, 100); const proximity = 1 - nearest.distanceKm / widthKm;
    events.push({ id: event.id, title: event.title, category: event.category, severity, distanceKm: round(nearest.distanceKm, 1), edgeId: nearest.edgeId, contribution: round(severity * (0.35 + proximity * 0.65), 1), time: event.time || event.timestamp });
  }
  events.sort((a, b) => b.contribution - a.contribution);
  const eventScore = clamp(100 * (1 - Math.exp(-events.reduce((sum, item) => sum + item.contribution, 0) / 180)), 0, 100);
  const nodeScores = (context.nodeRisks || []).map(item => Number(item.score)).filter(Number.isFinite);
  const nodeRisk = nodeScores.length ? nodeScores.reduce((a, b) => a + b, 0) / nodeScores.length : 0;
  const risk = combineRiskComponents({ event: eventScore, nodes: nodeRisk, weather: context.weatherScore, security: context.securityScore, congestion: context.congestionScore }, { event: 0.34, nodes: 0.24, weather: 0.13, security: 0.17, congestion: 0.12 });
  return Object.freeze({ risk, corridorWidthKm: widthKm, eventCount: events.length, evidence: Object.freeze(events.slice(0, 30)) });
}
