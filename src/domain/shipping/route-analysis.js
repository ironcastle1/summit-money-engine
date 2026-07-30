import { clamp, round, mean } from '../../core/numbers.js';
import { corridorEvents, pointToLineKm, routeLengthKm } from './network.js';
import { scoreNewsEvidence, combineDisruptionRisk } from './disruption.js';

export function analyseRoute(feature, context) {
  const properties = feature.properties || {};
  const widthKm = context.widthKm || 180;
  const eventMatches = corridorEvents(feature, context.events || [], widthKm);
  const eventContributions = eventMatches.map(item => {
    const severity = clamp(Number(item.event.severity || 0), 0, 100);
    const proximity = Math.max(0, 1 - item.distanceKm / widthKm);
    return severity * (0.25 + 0.75 * proximity);
  });
  const eventScore = eventContributions.length ? clamp(100 * (1 - Math.exp(-eventContributions.reduce((a, b) => a + b, 0) / 160)), 0, 100) : 0;
  const ports = (context.ports || []).filter(port => port.routeIds.includes(properties.id));
  const chokepoints = (context.chokepoints || []).filter(item => item.routeIds.includes(properties.id));
  const nodeRisks = [...ports, ...chokepoints].map(node => context.nodeRiskById?.get(node.id)?.score).filter(Number.isFinite);
  const nodeScore = nodeRisks.length ? mean(nodeRisks) : 0;
  const newsNode = { name: properties.name, country: '', unlocode: '', commodities: [properties.commodity, ...(context.commodityNames || [])] };
  const news = scoreNewsEvidence(newsNode, context.stories || []);
  const operationalScore = context.routeOperational?.get(properties.id)?.score;
  const risk = combineDisruptionRisk({ event: { score: eventScore, count: eventMatches.length }, news, operational: { score: operationalScore, sampleSize: Number.isFinite(operationalScore) ? 1 : 0 }, importance: properties.importance });
  return {
    id: properties.id, name: properties.name, class: properties.class, commodity: properties.commodity,
    importance: Number(properties.importance || 0), lengthKm: round(routeLengthKm(feature), 0), corridorWidthKm: widthKm,
    risk, eventCount: eventMatches.length, portCount: ports.length, chokepointCount: chokepoints.length,
    nodeRiskMean: nodeRisks.length ? round(mean(nodeRisks), 1) : null,
    evidence: { events: eventMatches.slice(0, 12).map(item => ({ id: item.event.id, title: item.event.title, distanceKm: round(item.distanceKm, 1), severity: item.event.severity })), news: news.evidence.slice(0, 8) }
  };
}

export function routeNearPoint(feature, point, maximumDistanceKm = 300) {
  const distanceKm = pointToLineKm(point, feature.geometry?.coordinates || []);
  return Number.isFinite(distanceKm) && distanceKm <= maximumDistanceKm ? { id: feature.properties?.id, name: feature.properties?.name, distanceKm: round(distanceKm, 1) } : null;
}
