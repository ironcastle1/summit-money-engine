export const HAZARD_TYPES = Object.freeze([ 'EARTHQUAKE', 'TROPICAL_CYCLONE', 'FLOOD', 'WILDFIRE', 'VOLCANO', 'TSUNAMI', 'EXTREME_HEAT', 'WINTER_STORM', 'DROUGHT', 'LANDSLIDE', 'SEVERE_WEATHER', 'OTHER' ]);
export const HAZARD_BANDS = Object.freeze(['LOW', 'GUARDED', 'ELEVATED', 'HIGH', 'SEVERE', 'CATASTROPHIC']);
export const MATERIALITY_DEFAULTS = Object.freeze( {
  minimumScore: 48, maximumAgeHours: 336, earthquakeMagnitude: 6, earthquakeSignificance: 600, tropicalWindKph: 119, wildfireAreaHectares: 10_000, floodDisplaced: 5_000, heatTemperatureC: 42, volcanoAlertLevels: Object.freeze(['ORANGE', 'RED']), tsunamiWaveMetres: 0.5
});
export const IMPACT_DOMAINS = Object.freeze([ 'HUMAN', 'INFRASTRUCTURE', 'LOGISTICS', 'ECONOMIC', 'ENERGY', 'FOOD', 'HEALTH', 'AVIATION', 'MARITIME', 'GOVERNANCE' ]);
export const DEFAULT_RADIUS_KM = Object.freeze( {
  EARTHQUAKE: 300, TROPICAL_CYCLONE: 450, FLOOD: 160, WILDFIRE: 120, VOLCANO: 250, TSUNAMI: 500, EXTREME_HEAT: 350, WINTER_STORM: 300, DROUGHT: 600, LANDSLIDE: 80, SEVERE_WEATHER: 180, OTHER: 120
});
