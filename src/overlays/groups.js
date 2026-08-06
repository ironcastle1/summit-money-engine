import { OVERLAY_GROUP_ORDER } from './constants.js';
export const OVERLAY_GROUPS = Object.freeze({
  reference: { id: 'reference', title: 'Reference', description: 'Boundaries, names and geographic context', order: 10 },
  terrain: { id: 'terrain', title: 'Terrain', description: 'Physical geography and land-surface context', order: 20 },
  conflict: { id: 'conflict', title: 'War and security', description: 'Armed conflict, attacks and military activity', order: 30 },
  politics: { id: 'politics', title: 'Politics', description: 'Elections, civil unrest, sanctions and state stability', order: 40 },
  logistics: { id: 'logistics', title: 'Logistics', description: 'Shipping, ports, corridors and trade infrastructure', order: 50 },
  hazards: { id: 'hazards', title: 'Hazards', description: 'Major natural hazards with material consequences', order: 60 },
  infrastructure: { id: 'infrastructure', title: 'Infrastructure', description: 'Energy, communications and strategic facilities', order: 70 },
  humanitarian: { id: 'humanitarian', title: 'Humanitarian', description: 'Displacement, food security, health and aid access', order: 80 },
  markets: { id: 'markets', title: 'Markets', description: 'Commodity, trade and supply-chain exposure', order: 90 },
  verification: { id: 'verification', title: 'Verification', description: 'Coverage, freshness and evidence-quality diagnostics', order: 100 }
});
export function orderedOverlayGroups() { return OVERLAY_GROUP_ORDER.map(id => OVERLAY_GROUPS[id]).filter(Boolean); }
