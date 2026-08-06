import { cargoProfile } from './cargo-profile.js';
import { fuelConsumption, fuelCost } from './fuel-model.js';
import { emissionsFromFuel, emissionsIntensity } from './emissions-model.js';
import { insuranceEstimate } from './insurance-model.js';
import { round } from './numbers.js';
import { freightRateEstimate } from './freight-rate-model.js';
import { cargoLossEstimate } from './cargo-loss-model.js';
export function routeCost(input = {}) {
  const cargo = cargoProfile(input.cargoClass || 'GENERAL'); const vessel = input.vessel;
  const fuel = fuelConsumption({ distanceKm: input.distanceKm, speedKmh: input.speedKmh, designSpeedKmh: vessel.speedKnots * 1.852, fuelTonnesPerDay: vessel.fuelTonnesPerDay, loadFactor: input.loadFactor, seaStateFactor: input.seaStateFactor });
  const bunkerCostUsd = fuelCost(fuel, input.fuelPricePerTonne || 650);
  const portFeesUsd = Math.max(0, Number(input.portFeesUsd || 0)); const canalFeesUsd = Math.max(0, Number(input.canalFeesUsd || 0));
  const handlingUsd = Math.max(0, Number(input.cargoTonnes || 0)) * Math.max(0, Number(input.handlingUsdPerTonne || 2.8)) * cargo.handlingFactor;
  const charterUsd = fuel.days * Math.max(0, Number(input.charterUsdPerDay || 24_000));
  const insurance = insuranceEstimate({ cargoValueUsd: input.cargoValueUsd, riskScore: input.riskScore, cargoFactor: cargo.insuranceFactor, warRiskArea: input.warRiskArea, sanctionsExposure: input.sanctionsExposure, piracyArea: input.piracyArea });
  const emissions = emissionsFromFuel(fuel.tonnes, input.fuelType || 'VLSFO'); const carbonCostUsd = emissions.co2Tonnes * Math.max(0, Number(input.carbonPriceUsd || 0));
  const freightRate = freightRateEstimate({ mode: input.mode || 'SEA', distanceKm: input.distanceKm, cargoTonnes: input.cargoTonnes, riskScore: input.riskScore, congestionScore: input.congestionScore, fuelIndex: input.fuelIndex, contractDiscountPct: input.contractDiscountPct });
  const cargoLoss = cargoLossEstimate({ cargoValueUsd: input.cargoValueUsd, riskScore: input.riskScore, handlingCount: input.handlingCount || 2, perishability: cargo.perishability, temperatureControlReliability: input.temperatureControlReliability, hazardFactor: cargo.hazard, transitDays: fuel.days });
  const totalUsd = bunkerCostUsd + portFeesUsd + canalFeesUsd + handlingUsd + charterUsd + insurance.premiumUsd + carbonCostUsd + cargoLoss.expectedLossUsd;
  return Object.freeze({ totalUsd: round(totalUsd, 2), benchmarkFreightRate: freightRate, cargoLoss, bunkerCostUsd, portFeesUsd: round(portFeesUsd, 2), canalFeesUsd: round(canalFeesUsd, 2), handlingUsd: round(handlingUsd, 2), charterUsd: round(charterUsd, 2), insurance, carbonCostUsd: round(carbonCostUsd, 2), fuel, emissions, emissionsIntensityGCo2TonneKm: emissionsIntensity(emissions, input.cargoTonnes, input.distanceKm), costPerTonneUsd: round(totalUsd / Math.max(1, Number(input.cargoTonnes || 1)), 2) });
}
