import { componentRecord } from './component-record.js';
import { stableSort } from './utilities.js';
export function componentInventory(items = []) { const components = stableSort(items.map(componentRecord), item => item.id); const byType = Object.fromEntries([...new Set(components.map(item => item.type))].map(type => [type, components.filter(item => item.type === type).length])); return Object.freeze({ components, count: components.length, byType, critical: components.filter(item => item.criticality === 'CRITICAL' || item.criticality === 'HIGH').map(item => item.id) }); }
