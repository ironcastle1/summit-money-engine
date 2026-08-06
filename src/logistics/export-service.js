import { alternativesGeoJson } from './map-features.js';
export class LogisticsExportService {
  toGeoJson(result) { return alternativesGeoJson(result.routes || []); }
  toCsv(result) {
    const header = ['rank','id','distance_km','duration_hours','cost_usd','risk_score','reliability_score','co2_tonnes','recommended'];
    const rows = (result.routes || []).map(route => [route.rank, route.id, route.metrics.distanceKm, route.metrics.eta.durationHours, route.metrics.cost.totalUsd, route.metrics.exposure.risk.score, route.metrics.reliability.score, route.metrics.cost.emissions.co2Tonnes, route.recommended]);
    return [header, ...rows].map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  }
  summary(result) { return Object.freeze({ generatedAt: result.generatedAt, request: result.request, recommended: result.routes?.find(route => route.recommended) || result.routes?.[0] || null, comparison: result.comparison, routeCount: result.routes?.length || 0 }); }
}
