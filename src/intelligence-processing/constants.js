export const ENTITY_TYPES = Object.freeze([
    'PLACE', 'COUNTRY', 'CITY', 'PORT', 'CHOKEPOINT', 'ORGANISATION', 'PERSON',
    'ASSET', 'COMMODITY', 'INFRASTRUCTURE', 'MILITARY_UNIT', 'VESSEL', 'AIRCRAFT'
]);
export const CLAIM_TYPES = Object.freeze([
    'OCCURRENCE', 'LOCATION', 'QUANTITY', 'STATUS', 'ATTRIBUTION', 'FORECAST',
    'CAUSAL', 'DENIAL', 'IMPACT', 'OWNERSHIP'
]);
export const IMPACT_DOMAINS = Object.freeze([
    'HUMAN', 'POLITICAL', 'MILITARY', 'SECURITY', 'ECONOMIC', 'MARKET', 'ENERGY',
    'SHIPPING', 'AVIATION', 'SUPPLY_CHAIN', 'INFRASTRUCTURE', 'HUMANITARIAN',
    'HEALTH', 'ENVIRONMENTAL', 'INFORMATION'
]);
export const MATERIALITY_LEVELS = Object.freeze(['ROUTINE', 'NOTABLE', 'MATERIAL', 'CRITICAL']);
export const CONFIDENCE_LABELS = Object.freeze(['VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']);
export const DEFAULT_THRESHOLDS = Object.freeze({
    duplicateText: 0.9,
    clusterSimilarity: 0.58,
    entityMerge: 0.76,
    materialScore: 52,
    criticalScore: 78,
    majorEarthquakeMagnitude: 6.5,
    populatedEarthquakeMagnitude: 5.8,
    tsunamiEarthquakeMagnitude: 7,
    corroboratedIndependentSources: 2,
    maxClusterAgeHours: 72
});
export const STATUS_TRANSITIONS = Object.freeze({
    RUMOURED: ['REPORTED', 'DISPUTED', 'RETRACTED'],
    REPORTED: ['CONFIRMED', 'DISPUTED', 'RESOLVED', 'RETRACTED'],
    CONFIRMED: ['ONGOING', 'RESOLVED', 'DISPUTED'],
    ONGOING: ['ESCALATING', 'STABLE', 'RESOLVED'],
    ESCALATING: ['ONGOING', 'STABLE', 'RESOLVED'],
    STABLE: ['ONGOING', 'RESOLVED'],
    DISPUTED: ['CONFIRMED', 'RETRACTED', 'RESOLVED'],
    RETRACTED: [],
    RESOLVED: []
});
export function confidenceLabel(score) {
    const value = Number(score) || 0;
    if (value >= 85)
        return 'VERY_HIGH';
    if (value >= 70)
        return 'HIGH';
    if (value >= 50)
        return 'MODERATE';
    if (value >= 30)
        return 'LOW';
    return 'VERY_LOW';
}
export function materialityLevel(score) {
    const value = Number(score) || 0;
    if (value >= DEFAULT_THRESHOLDS.criticalScore)
        return 'CRITICAL';
    if (value >= DEFAULT_THRESHOLDS.materialScore)
        return 'MATERIAL';
    if (value >= 30)
        return 'NOTABLE';
    return 'ROUTINE';
}
