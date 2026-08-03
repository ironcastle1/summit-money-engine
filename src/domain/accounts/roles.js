export const ROLES = Object.freeze({
  USER: 'USER',
  ANALYST: 'ANALYST',
  ADMIN: 'ADMIN',
  OWNER: 'OWNER'
});

export const ROLE_ORDER = Object.freeze([ROLES.USER, ROLES.ANALYST, ROLES.ADMIN, ROLES.OWNER]);

export function normalizeRole(value) {
  const role = String(value || '').trim().toUpperCase();
  return ROLE_ORDER.includes(role) ? role : ROLES.USER;
}

export function roleAtLeast(actual, required) {
  return ROLE_ORDER.indexOf(normalizeRole(actual)) >= ROLE_ORDER.indexOf(normalizeRole(required));
}

export function canManageRole(actorRole, targetRole) {
  const actor = normalizeRole(actorRole);
  const target = normalizeRole(targetRole);
  if (actor === ROLES.OWNER) return target !== ROLES.OWNER;
  if (actor === ROLES.ADMIN) return [ROLES.USER, ROLES.ANALYST].includes(target);
  return false;
}
