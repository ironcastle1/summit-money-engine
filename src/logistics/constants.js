export const TRANSPORT_MODES = Object.freeze(['SEA', 'RAIL', 'ROAD', 'AIR', 'PIPELINE', 'MULTIMODAL']);
export const VESSEL_CLASSES = Object.freeze(['FEEDER', 'PANAMAX', 'POST_PANAMAX', 'ULCV', 'HANDYSIZE', 'AFRAMAX', 'SUEZMAX', 'VLCC', 'LNG', 'LPG', 'RORO', 'GENERAL_CARGO']);
export const CARGO_CLASSES = Object.freeze(['CONTAINERS', 'DRY_BULK', 'CRUDE', 'REFINED', 'LNG', 'LPG', 'REFRIGERATED', 'VEHICLES', 'PROJECT', 'HAZARDOUS', 'GENERAL']);
export const RISK_BANDS = Object.freeze([
  Object.freeze({ id: 'CRITICAL', minimum: 80 }),
  Object.freeze({ id: 'HIGH', minimum: 60 }),
  Object.freeze({ id: 'ELEVATED', minimum: 40 }),
  Object.freeze({ id: 'GUARDED', minimum: 20 }),
  Object.freeze({ id: 'LOW', minimum: 0 })
]);
export const DEFAULT_ROUTE_POLICY = Object.freeze({
  id: 'BALANCED',
  weights: Object.freeze({ time: 0.26, cost: 0.24, risk: 0.30, reliability: 0.20 }),
  maximumAlternatives: 5,
  minimumReliability: 0,
  avoidCriticalRisk: true,
  allowModeChanges: true
});
export const ROUTE_POLICY_IDS = Object.freeze(['FASTEST', 'CHEAPEST', 'LOWEST_RISK', 'MOST_RELIABLE', 'BALANCED']);
export const DISRUPTION_TYPES = Object.freeze(['CONFLICT', 'SECURITY', 'WEATHER', 'EARTHQUAKE', 'FLOOD', 'PORT_CLOSURE', 'CONGESTION', 'STRIKE', 'SANCTIONS', 'INFRASTRUCTURE', 'PIRACY', 'CUSTOMS', 'LABOUR', 'CYBER', 'OTHER']);
export const ROUTE_STATUS = Object.freeze(['OPEN', 'DEGRADED', 'RESTRICTED', 'CLOSED', 'UNKNOWN']);
export const ALERT_TYPES = Object.freeze(['RISK_THRESHOLD', 'ETA_CHANGE', 'COST_CHANGE', 'ROUTE_CLOSURE', 'PORT_CONGESTION', 'CHOKEPOINT_DISRUPTION', 'SANCTIONS_MATCH', 'WEATHER_IMPACT']);
export const EARTH_RADIUS_KM = 6371.0088;
export const DEFAULT_CORRIDOR_WIDTH_KM = 180;
export const DEFAULT_ROUTE_SPEED_KNOTS = 17;
export const KNOT_TO_KMH = 1.852;
export const HOURS_PER_DAY = 24;
export const MAX_ROUTE_ALTERNATIVES = 12;
