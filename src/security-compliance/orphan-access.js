export function orphanAccess(assignments = [], users = []) {
  const activeUsers = new Set(users.filter(user => user.active !== false).map(user => String(user.id)));
  return Object.freeze(assignments.filter(item => !activeUsers.has(String(item.userId))).map(item => Object.freeze({ ...item, finding: 'ORPHANED_ACCESS', severity: 'HIGH' })));
}
