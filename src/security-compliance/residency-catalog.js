export const DATA_REGIONS = Object.freeze([
  { id: 'UK', name: 'United Kingdom', jurisdictions: ['UK'], adequacy: ['EEA'] },
  { id: 'EEA', name: 'European Economic Area', jurisdictions: ['EU', 'EEA'], adequacy: ['UK'] },
  { id: 'US', name: 'United States', jurisdictions: ['US'], adequacy: [] },
  { id: 'CA', name: 'Canada', jurisdictions: ['CA'], adequacy: ['UK', 'EEA'] },
  { id: 'AU', name: 'Australia', jurisdictions: ['AU'], adequacy: [] },
  { id: 'GLOBAL', name: 'Global multi-region', jurisdictions: ['GLOBAL'], adequacy: [] }
]);

export function regionById(id) {
  return DATA_REGIONS.find(item => item.id === String(id || '').toUpperCase()) || null;
}
