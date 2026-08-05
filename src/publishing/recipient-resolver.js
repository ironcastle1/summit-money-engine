import { canReceiveClassification } from './classification-policy.js';
import { compareText, frozen, unique } from './utilities.js';

function matchesFilters(subscriber, filters = {}) {
  if (filters.active !== undefined && Boolean(subscriber.active) !== Boolean(filters.active)) return false;
  if (filters.countryCodes?.length && !filters.countryCodes.includes(subscriber.countryCode)) return false;
  if (filters.organisations?.length && !filters.organisations.includes(subscriber.organisation)) return false;
  if (filters.roles?.length && !filters.roles.includes(subscriber.role)) return false;
  if (filters.tags?.length && !filters.tags.some(tag => subscriber.tags?.includes(tag))) return false;
  return true;
}

export function resolveRecipients(input = {}) {
  const subscribers = input.subscribers || [];
  const audiences = input.audiences || [];
  const ids = new Set(unique(input.subscriberIds || [], 10000));
  for (const audience of audiences) {
    for (const id of audience.subscriberIds || []) ids.add(id);
    for (const subscriber of subscribers) if (matchesFilters(subscriber, audience.filters)) ids.add(subscriber.id);
  }
  const classification = String(input.classification || 'CLIENT').toUpperCase();
  const resolved = subscribers.filter(item => ids.has(item.id) && item.active !== false && canReceiveClassification(item.clearance, classification));
  return frozen(resolved.sort((a, b) => compareText(a.name, b.name)));
}
