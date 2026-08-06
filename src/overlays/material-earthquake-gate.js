import { MATERIAL_EARTHQUAKE_MAGNITUDE, MATERIAL_EARTHQUAKE_SEVERITY, MATERIAL_EARTHQUAKE_SIGNIFICANCE } from './constants.js';
const truthy = value => value === true || String(value).toLowerCase() === 'true';
export function isEarthquake(record) { return String(record?.category || record?.kind || record?.type || '').toLowerCase().includes('earthquake'); }
export function earthquakeMateriality(record = {}) {
  if (!isEarthquake(record)) return Object.freeze({ earthquake: false, material: true, reasons: ['NOT_EARTHQUAKE'] });
  const magnitude = Number(record.magnitude ?? record.attributes?.magnitude ?? 0);
  const significance = Number(record.significance ?? record.attributes?.significance ?? 0);
  const severity = Number(record.severity ?? record.risk?.score ?? 0);
  const reasons = [];
  if (truthy(record.material)) reasons.push('EXPLICIT_MATERIAL');
  if (truthy(record.tsunami) || truthy(record.attributes?.tsunami)) reasons.push('TSUNAMI');
  if (truthy(record.shippingImpact) || truthy(record.attributes?.shippingImpact)) reasons.push('SHIPPING_IMPACT');
  if (truthy(record.infrastructureImpact) || truthy(record.attributes?.infrastructureImpact)) reasons.push('INFRASTRUCTURE_IMPACT');
  if (truthy(record.sovereignImpact) || truthy(record.attributes?.sovereignImpact)) reasons.push('SOVEREIGN_IMPACT');
  if (Number.isFinite(magnitude) && magnitude >= MATERIAL_EARTHQUAKE_MAGNITUDE) reasons.push('MAGNITUDE_THRESHOLD');
  if (Number.isFinite(significance) && significance >= MATERIAL_EARTHQUAKE_SIGNIFICANCE) reasons.push('SIGNIFICANCE_THRESHOLD');
  if (Number.isFinite(severity) && severity >= MATERIAL_EARTHQUAKE_SEVERITY) reasons.push('SEVERITY_THRESHOLD');
  return Object.freeze({ earthquake: true, material: reasons.length > 0, reasons: Object.freeze(reasons), magnitude, significance, severity });
}
export function retainMaterialEarthquake(record) { return earthquakeMateriality(record).material; }
