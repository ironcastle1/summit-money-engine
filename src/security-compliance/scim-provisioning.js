import { clean } from './utilities.js';

export function scimOperation(input = {}) {
  const operation = clean(input.operation || 'UPSERT', 40).toUpperCase();
  const user = input.user || {};
  if (!user.externalId && !user.email) throw new TypeError('SCIM user externalId or email is required');
  return Object.freeze({
    operation,
    externalId: clean(user.externalId || user.email, 190),
    email: clean(user.email, 320).toLowerCase(),
    active: user.active !== false,
    roles: Object.freeze((user.roles || []).map(value => clean(value, 80).toUpperCase())),
    groups: Object.freeze((user.groups || []).map(value => clean(value, 190))),
    source: 'SCIM'
  });
}
