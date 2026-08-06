import { clean, frozen } from './utilities.js';

export function tableSpec(input = {}) {
  const columns = (input.columns || []).slice(0, 30).map(column => frozen({ key: clean(column.key, 120), label: clean(column.label || column.key, 120), format: clean(column.format || 'TEXT', 40).toUpperCase() }));
  return frozen({
    title: clean(input.title, 240),
    columns: Object.freeze(columns),
    rows: Object.freeze((input.rows || []).slice(0, 5000).map(row => frozen({ ...row }))),
    sort: frozen({ ...(input.sort || {}) }),
    notes: clean(input.notes, 1000)
  });
}
