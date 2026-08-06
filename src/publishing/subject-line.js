import { clean } from './utilities.js';

export function subjectLine(input = {}) {
  const prefix = clean(input.prefix || 'Merlin', 80);
  const title = clean(input.title || input.edition?.title || 'Intelligence briefing', 180);
  const urgency = String(input.urgency || '').toUpperCase();
  const marker = ['URGENT', 'CRITICAL'].includes(urgency) ? `[${urgency}] ` : '';
  return clean(`${marker}${prefix}: ${title}`, 240);
}
