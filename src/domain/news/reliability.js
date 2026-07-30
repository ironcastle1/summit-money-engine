import { clamp, round } from '../../core/numbers.js';

const DEFAULT_PROFILE = Object.freeze({ tier: 'UNRATED', reliability: 50, transparency: 40, correctionRecord: 40, ownershipClarity: 40 });

const DOMAIN_PROFILES = Object.freeze({
  'reuters.com': { tier: 'A', reliability: 92, transparency: 90, correctionRecord: 91, ownershipClarity: 92 },
  'apnews.com': { tier: 'A', reliability: 91, transparency: 90, correctionRecord: 90, ownershipClarity: 90 },
  'bbc.co.uk': { tier: 'A', reliability: 88, transparency: 88, correctionRecord: 88, ownershipClarity: 92 },
  'bbc.com': { tier: 'A', reliability: 88, transparency: 88, correctionRecord: 88, ownershipClarity: 92 },
  'ft.com': { tier: 'A', reliability: 88, transparency: 87, correctionRecord: 87, ownershipClarity: 90 },
  'bloomberg.com': { tier: 'A', reliability: 87, transparency: 86, correctionRecord: 86, ownershipClarity: 88 },
  'wsj.com': { tier: 'A', reliability: 86, transparency: 85, correctionRecord: 85, ownershipClarity: 88 },
  'theguardian.com': { tier: 'B', reliability: 80, transparency: 83, correctionRecord: 82, ownershipClarity: 90 },
  'aljazeera.com': { tier: 'B', reliability: 79, transparency: 78, correctionRecord: 78, ownershipClarity: 82 },
  'dw.com': { tier: 'A', reliability: 85, transparency: 86, correctionRecord: 84, ownershipClarity: 90 },
  'france24.com': { tier: 'B', reliability: 81, transparency: 81, correctionRecord: 80, ownershipClarity: 87 },
  'npr.org': { tier: 'A', reliability: 85, transparency: 87, correctionRecord: 86, ownershipClarity: 90 },
  'economist.com': { tier: 'A', reliability: 86, transparency: 84, correctionRecord: 85, ownershipClarity: 87 },
  'cnbc.com': { tier: 'B', reliability: 78, transparency: 77, correctionRecord: 78, ownershipClarity: 85 },
  'marketwatch.com': { tier: 'B', reliability: 77, transparency: 76, correctionRecord: 76, ownershipClarity: 84 },
  'coindesk.com': { tier: 'B', reliability: 75, transparency: 75, correctionRecord: 74, ownershipClarity: 80 },
  'cointelegraph.com': { tier: 'C', reliability: 64, transparency: 63, correctionRecord: 62, ownershipClarity: 70 },
  'x.com': { tier: 'SOCIAL', reliability: 35, transparency: 25, correctionRecord: 20, ownershipClarity: 70 },
  'bsky.app': { tier: 'SOCIAL', reliability: 38, transparency: 32, correctionRecord: 22, ownershipClarity: 78 }
});

function normalizedDomain(value) {
  return String(value || '').toLowerCase().replace(/^www\./, '');
}

export function sourceProfile(domain, sourceType = 'NEWS') {
  const normalized = normalizedDomain(domain);
  const exact = DOMAIN_PROFILES[normalized];
  const parent = Object.entries(DOMAIN_PROFILES).find(([key]) => normalized.endsWith(`.${key}`))?.[1];
  const profile = exact || parent || (sourceType === 'SOCIAL' ? { ...DEFAULT_PROFILE, tier: 'SOCIAL', reliability: 35, transparency: 25 } : DEFAULT_PROFILE);
  const score = round(clamp(profile.reliability * 0.55 + profile.transparency * 0.2 + profile.correctionRecord * 0.15 + profile.ownershipClarity * 0.1, 0, 100));
  return Object.freeze({ domain: normalized || null, ...profile, score, rated: Boolean(exact || parent) });
}

export function reliabilityCatalogue() {
  return Object.entries(DOMAIN_PROFILES).map(([domain, profile]) => ({ domain, ...sourceProfile(domain), ...profile }));
}
