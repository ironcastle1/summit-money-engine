import { IMPACT_DOMAINS } from './constants.js';
export const IMPACT_KEYWORDS = Object.freeze({
    HUMAN: ['killed', 'dead', 'death', 'injured', 'casualties', 'missing', 'evacuated', 'displaced', 'hostage'],
    POLITICAL: ['election', 'parliament', 'government', 'minister', 'president', 'sanction', 'coup', 'diplomatic', 'referendum', 'policy'],
    MILITARY: ['military', 'army', 'navy', 'air force', 'missile', 'drone', 'troops', 'offensive', 'artillery', 'strike', 'frontline'],
    SECURITY: ['attack', 'terror', 'explosion', 'shooting', 'riot', 'protest', 'police', 'arrest', 'crime', 'border'],
    ECONOMIC: ['gdp', 'inflation', 'recession', 'trade', 'tariff', 'employment', 'currency', 'debt', 'budget', 'tax'],
    MARKET: ['shares', 'stock', 'bond', 'yield', 'bitcoin', 'crypto', 'market', 'price', 'futures', 'volatility'],
    ENERGY: ['oil', 'gas', 'lng', 'pipeline', 'refinery', 'electricity', 'power grid', 'nuclear', 'fuel', 'energy'],
    SHIPPING: ['ship', 'vessel', 'port', 'canal', 'strait', 'freight', 'container', 'tanker', 'maritime', 'shipping'],
    AVIATION: ['airport', 'airline', 'flight', 'airspace', 'aircraft', 'aviation', 'runway'],
    SUPPLY_CHAIN: ['supply chain', 'shortage', 'factory', 'production', 'inventory', 'logistics', 'warehouse', 'export ban'],
    INFRASTRUCTURE: ['bridge', 'road', 'rail', 'telecom', 'internet', 'dam', 'hospital', 'infrastructure', 'outage'],
    HUMANITARIAN: ['aid', 'famine', 'refugee', 'relief', 'food insecurity', 'humanitarian', 'shelter'],
    HEALTH: ['disease', 'outbreak', 'virus', 'hospital', 'health', 'epidemic', 'pandemic', 'vaccine'],
    ENVIRONMENTAL: ['earthquake', 'flood', 'wildfire', 'storm', 'drought', 'landslide', 'volcano', 'pollution', 'climate'],
    INFORMATION: ['cyber', 'disinformation', 'propaganda', 'internet', 'media', 'censorship', 'data breach', 'hack']
});
export const IMPACT_WEIGHTS = Object.freeze({
    HUMAN: 1.25, POLITICAL: 1.05, MILITARY: 1.15, SECURITY: 1.1, ECONOMIC: 1.1, MARKET: 0.9, ENERGY: 1.2,
    SHIPPING: 1.2, AVIATION: 1.05, SUPPLY_CHAIN: 1.15, INFRASTRUCTURE: 1.2, HUMANITARIAN: 1.2,
    HEALTH: 1.15, ENVIRONMENTAL: 1.1, INFORMATION: 0.85
});
export function isImpactDomain(value) { return IMPACT_DOMAINS.includes(String(value).toUpperCase()); }
