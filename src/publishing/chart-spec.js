import { clean, frozen } from './utilities.js';

export function chartSpec(input = {}) {
  const type = String(input.type || 'BAR').toUpperCase();
  if (!['BAR', 'LINE', 'AREA', 'SCATTER', 'DONUT'].includes(type)) throw new TypeError(`Unsupported chart type: ${type}`);
  return frozen({
    type,
    title: clean(input.title, 240),
    xKey: clean(input.xKey || 'label', 120),
    yKeys: Object.freeze([...(input.yKeys || ['value'])].map(value => clean(value, 120))),
    data: Object.freeze([...(input.data || [])].slice(0, 1000).map(item => frozen({ ...item }))),
    notes: clean(input.notes, 1000)
  });
}
