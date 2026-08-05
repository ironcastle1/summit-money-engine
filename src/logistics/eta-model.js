import { HOURS_PER_DAY } from './constants.js';
import { clamp, round } from './numbers.js';
export function segmentDurationHours(input) {
  const speed = Math.max(1, Number(input.speedKmh || 30)); const distance = Math.max(0, Number(input.distanceKm || 0));
  const weather = clamp(Number(input.weatherMultiplier || 1), 0.6, 2.5); const congestion = Math.max(0, Number(input.congestionHours || 0));
  const canal = Math.max(0, Number(input.canalTransitHours || 0)); const handling = Math.max(0, Number(input.handlingHours || 0));
  return round(distance / speed * weather + congestion + canal + handling, 2);
}
export function etaFromSegments(departureAt, segments) {
  const departure = new Date(departureAt || Date.now()); const hours = segments.reduce((sum, segment) => sum + Number(segment.durationHours || 0), 0);
  const arrival = new Date(departure.getTime() + hours * 3_600_000);
  return Object.freeze({ departureAt: departure.toISOString(), arrivalAt: arrival.toISOString(), durationHours: round(hours, 2), durationDays: round(hours / HOURS_PER_DAY, 2) });
}
export function etaRange(eta, uncertaintyHours = 0) {
  const center = new Date(eta.arrivalAt).getTime(); const spread = Math.max(0, Number(uncertaintyHours)) * 3_600_000;
  return Object.freeze({ earliestAt: new Date(center - spread).toISOString(), expectedAt: eta.arrivalAt, latestAt: new Date(center + spread).toISOString(), uncertaintyHours: round(uncertaintyHours, 1) });
}
