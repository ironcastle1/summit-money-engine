import test from 'node:test';
import assert from 'node:assert/strict';
import { canalTransitEstimate } from '../../src/logistics/canal-transit-model.js';
import { customsClearanceEstimate } from '../../src/logistics/customs-delay-model.js';
import { freightRateEstimate } from '../../src/logistics/freight-rate-model.js';
import { cargoLossEstimate } from '../../src/logistics/cargo-loss-model.js';
import { inventoryImpact } from '../../src/logistics/inventory-impact.js';
import { serviceLevelEstimate } from '../../src/logistics/service-level-model.js';

test('canal and customs models expose compatibility, fees and delay uncertainty', () => {
  const canal = canalTransitEstimate({
    canalId: 'PANAMA',
    draftM: 14,
    beamM: 45,
    queueVessels: 12,
    reservationPremiumPct: 20,
    droughtRestrictionPct: 15
  });
  assert.equal(canal.compatible, true);
  assert.ok(canal.transitHours > 20);
  assert.ok(canal.feeUsd > 420000);

  const customs = customsClearanceEstimate({
    channel: 'PHYSICAL',
    documentCompletenessPct: 80,
    sanctionsScreening: true,
    portCongestionScore: 70
  });
  assert.ok(customs.expectedHours > 50);
  assert.ok(customs.uncertaintyHours > 0);
});

test('freight economics quantify rate, cargo loss, inventory and service exposure', () => {
  const freight = freightRateEstimate({
    mode: 'SEA',
    distanceKm: 12000,
    cargoTonnes: 25000,
    riskScore: 65,
    congestionScore: 55,
    fuelIndex: 1.3
  });
  assert.ok(freight.quotedUsd > 0);
  assert.ok(freight.effectiveUsdPerTonne > 0);

  const loss = cargoLossEstimate({
    cargoValueUsd: 50000000,
    riskScore: 65,
    handlingCount: 4,
    perishability: 0.8,
    temperatureControlReliability: 0.92,
    transitDays: 30
  });
  assert.ok(loss.expectedLossUsd > 0);

  const inventory = inventoryImpact({
    cargoValueUsd: 50000000,
    durationDays: 30,
    uncertaintyDays: 8,
    safetyStockDays: 3,
    dailyDemandUnits: 1000,
    unitValueUsd: 50
  });
  assert.equal(inventory.additionalSafetyStockDays, 5);
  assert.ok(inventory.totalCarryingCostUsd > 0);

  const service = serviceLevelEstimate({
    reliabilityScore: 78,
    targetServiceLevelPct: 95,
    demandStdDevPerDay: 120,
    leadTimeDays: 30,
    leadTimeStdDevDays: 3,
    averageDailyDemand: 1000
  });
  assert.ok(service.safetyStockUnits > 0);
  assert.equal(service.meetsTarget, false);
});
