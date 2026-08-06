import { makePublishingId } from './ids.js';
import { clean, frozen, unique } from './utilities.js';

export function subscriberRecord(input = {}) {
  const now = new Date().toISOString();
  const email = clean(input.email, 320).toLowerCase();
  return frozen({
    id: clean(input.id, 190) || makePublishingId('subscriber', email || input.name),
    name: clean(input.name || email || 'Subscriber', 180),
    email,
    organisation: clean(input.organisation, 180),
    role: clean(input.role, 160),
    countryCode: clean(input.countryCode, 3).toUpperCase(),
    channels: unique(input.channels || ['IN_APP'], 10).map(value => String(value).toUpperCase()),
    tags: unique(input.tags || [], 100),
    clearance: String(input.clearance || 'CLIENT').toUpperCase(),
    locale: clean(input.locale || 'en-GB', 20),
    timezone: clean(input.timezone || 'Europe/London', 80),
    webhookUrl: clean(input.webhookUrl, 1000),
    active: input.active !== false,
    consent: frozen({ marketing: Boolean(input.consent?.marketing), operational: input.consent?.operational !== false }),
    createdAt: input.createdAt || now,
    updatedAt: now
  });
}
