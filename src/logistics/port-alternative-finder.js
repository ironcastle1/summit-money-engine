import { haversineKm } from './geo.js';
import { clamp, round } from './numbers.js';

function commodityOverlap(source, candidate) {
  const sourceSet = new Set(source.commodities || []);
  const candidateSet = new Set(candidate.commodities || []);
  if (!sourceSet.size || !candidateSet.size) return 0.5;
  const intersection = [...sourceSet].filter(value => candidateSet.has(value)).length;
  return intersection / Math.max(1, sourceSet.size);
}

export function findAlternativePorts(port, ports, context = {}) {
  const maximumDistanceKm = Math.max(50, Number(context.maximumDistanceKm || 1800));
  const minimumImportance = clamp(Number(context.minimumImportance || 35), 0, 100);
  const sourceRisk = Number(context.riskById?.get?.(port.id)?.score || 0);

  return ports
    .filter(candidate => candidate.id !== port.id)
    .filter(candidate => Number(candidate.importance || 0) >= minimumImportance)
    .map(candidate => {
      const distanceKm = haversineKm(port.coordinates, candidate.coordinates);
      const overlap = commodityOverlap(port, candidate);
      const candidateRisk = Number(context.riskById?.get?.(candidate.id)?.score || 0);
      const importance = clamp(Number(candidate.importance || 0), 0, 100);
      const distanceScore = Math.max(0, 100 - distanceKm / maximumDistanceKm * 100);
      const riskImprovement = sourceRisk - candidateRisk;
      const score = clamp(
        distanceScore * 0.28 +
        overlap * 100 * 0.32 +
        importance * 0.24 +
        Math.max(0, riskImprovement) * 0.16,
        0,
        100
      );

      return Object.freeze({
        id: candidate.id,
        name: candidate.name,
        country: candidate.country,
        countryCode: candidate.countryCode,
        distanceKm: round(distanceKm, 1),
        commodityOverlapPct: round(overlap * 100, 1),
        importance,
        riskScore: candidateRisk,
        riskImprovement: round(riskImprovement, 1),
        suitabilityScore: round(score, 1)
      });
    })
    .filter(candidate => candidate.distanceKm <= maximumDistanceKm)
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    .slice(0, context.limit || 12);
}
