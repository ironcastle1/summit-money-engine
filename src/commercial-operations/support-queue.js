import { supportSla } from './support-sla.js';
const severityOrder = { SEV1: 4, SEV2: 3, SEV3: 2, SEV4: 1 };
export function prioritizeSupportQueue(cases = [], now = Date.now()) { return [...cases].map(item => ({ item, sla: supportSla(item, now) })).sort((a, b) => Number(Object.values(b.sla.breaches).some(Boolean)) - Number(Object.values(a.sla.breaches).some(Boolean)) || severityOrder[b.item.severity] - severityOrder[a.item.severity] || String(a.item.createdAt).localeCompare(String(b.item.createdAt))).map(entry => Object.freeze({ ...entry.item, sla: entry.sla })); }
