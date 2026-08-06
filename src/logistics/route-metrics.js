import { etaFromSegments, etaRange, segmentDurationHours } from './eta-model.js';
import { routeReliability } from './reliability-model.js';
import { routeCost } from './route-cost.js';
import { routeExposure } from './route-exposure.js';
import { vesselProfile } from './vessel-profile.js';
import { cargoProfile } from './cargo-profile.js';
import { canalTransitEstimate } from './canal-transit-model.js';
import { customsClearanceEstimate } from './customs-delay-model.js';
import { inventoryImpact } from './inventory-impact.js';
import { serviceLevelEstimate } from './service-level-model.js';
import { round } from './numbers.js';

function segmentCanal(edge, vessel, context) {
  const canalId = edge.restrictions?.canalId;
  if (!canalId) {
    return null;
  }

  return canalTransitEstimate({
    canalId,
    draftM: vessel.draftM,
    beamM: context.vesselBeamM,
    queueVessels: context.canalQueueById?.get?.(canalId)?.queueVessels || 0,
    reservationPremiumPct: context.canalQueueById?.get?.(canalId)?.reservationPremiumPct || 0,
    droughtRestrictionPct: context.canalQueueById?.get?.(canalId)?.droughtRestrictionPct || 0
  });
}

export function calculateRouteMetrics(path, request, context = {}) {
  const vessel = vesselProfile(request.vesselClass);
  const cargo = cargoProfile(request.cargoClass);
  const speedKmh = vessel.speedKnots * 1.852;
  const exposure = routeExposure(path.edges, context);
  const canalTransits = [];

  const customs = customsClearanceEstimate({
    channel: context.customsChannel || 'DOCUMENTARY',
    documentCompletenessPct: context.documentCompletenessPct ?? 100,
    trustedTrader: context.trustedTrader,
    perishability: cargo.perishability,
    hazardous: cargo.hazard >= 0.7,
    sanctionsScreening: Boolean(context.sanctionsExposure),
    randomInspectionRatePct: context.randomInspectionRatePct || 0,
    portCongestionScore: context.congestionScore || 0
  });

  const segments = path.edges.map((edge, index) => {
    const weatherMultiplier = context.weatherByEdge?.get?.(edge.id)?.speedMultiplier || 1;
    const canal = segmentCanal(edge, vessel, context);
    if (canal) {
      canalTransits.push(canal);
    }

    const destinationCustomsHours = index === path.edges.length - 1
      ? customs.expectedHours
      : 0;
    const durationHours = segmentDurationHours({
      distanceKm: edge.distanceKm,
      speedKmh: Math.min(speedKmh, edge.baseSpeedKmh || speedKmh),
      weatherMultiplier,
      congestionHours: context.congestionByNode?.get?.(edge.to)?.delayHours || 0,
      canalTransitHours: canal?.compatible === false
        ? 0
        : canal?.transitHours || edge.restrictions?.canalTransitHours || 0,
      handlingHours: (edge.metadata?.connector ? 3 : 0) + destinationCustomsHours
    });

    return Object.freeze({
      id: edge.id,
      name: edge.name,
      from: edge.from,
      to: edge.to,
      mode: edge.mode,
      distanceKm: edge.distanceKm,
      durationHours,
      weatherMultiplier,
      canal,
      customsHours: destinationCustomsHours
    });
  });

  const distanceKm = segments.reduce((sum, segment) => sum + segment.distanceKm, 0);
  const eta = etaFromSegments(request.departureAt, segments);
  const reliability = routeReliability({
    riskScore: exposure.risk.score,
    congestionScore: context.congestionScore || 0,
    weatherScore: context.weatherScore || 0,
    redundancyScore: context.redundancyScore || 0,
    historicalOnTimePct: context.historicalOnTimePct || 82
  });
  const cargoValueUsd = context.cargoValueUsd || request.cargoTonnes * 1500;
  const cost = routeCost({
    cargoClass: request.cargoClass,
    mode: request.mode,
    vessel,
    distanceKm,
    speedKmh,
    cargoTonnes: request.cargoTonnes,
    cargoValueUsd,
    riskScore: exposure.risk.score,
    congestionScore: context.congestionScore || 0,
    fuelPricePerTonne: context.fuelPricePerTonne,
    fuelIndex: context.fuelIndex,
    contractDiscountPct: context.contractDiscountPct,
    portFeesUsd: context.portFeesUsd || segments.length * 8000,
    canalFeesUsd: context.canalFeesUsd || canalTransits.reduce((sum, item) => sum + Number(item.feeUsd || 0), 0),
    carbonPriceUsd: context.carbonPriceUsd || 0,
    warRiskArea: exposure.risk.score >= 60,
    sanctionsExposure: Boolean(context.sanctionsExposure),
    piracyArea: Boolean(context.piracyArea),
    temperatureControlReliability: context.temperatureControlReliability,
    handlingCount: Math.max(2, segments.filter(segment => segment.from !== segment.to).length)
  });
  const inventory = inventoryImpact({
    cargoValueUsd,
    durationDays: eta.durationDays,
    annualHoldingRatePct: context.annualHoldingRatePct,
    costOfCapitalPct: context.costOfCapitalPct,
    safetyStockDays: context.safetyStockDays,
    uncertaintyDays: reliability.uncertaintyHours / 24,
    dailyDemandUnits: context.dailyDemandUnits,
    unitValueUsd: context.unitValueUsd
  });
  const serviceLevel = serviceLevelEstimate({
    reliabilityScore: reliability.score,
    targetServiceLevelPct: context.targetServiceLevelPct,
    demandStdDevPerDay: context.demandStdDevPerDay,
    leadTimeDays: eta.durationDays,
    leadTimeStdDevDays: reliability.uncertaintyHours / 24,
    averageDailyDemand: context.averageDailyDemand
  });

  return Object.freeze({
    distanceKm: round(distanceKm, 1),
    eta,
    etaRange: etaRange(eta, reliability.uncertaintyHours + customs.uncertaintyHours),
    reliability,
    exposure,
    cost,
    inventory,
    serviceLevel,
    customs,
    canalTransits: Object.freeze(canalTransits),
    segments: Object.freeze(segments),
    nodeIds: path.nodeIds,
    routeIds: Object.freeze(path.edges.map(edge => edge.id)),
    rawPathCost: round(path.cost, 4)
  });
}
