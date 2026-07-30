import { NotFoundError, ValidationError } from '../core/errors.js';
import { canManageRole, normalizeRole } from '../domain/accounts/roles.js';
import { publicUser } from '../domain/accounts/user-schema.js';
export class AdminService {
  constructor(options) { Object.assign(this, options); }
  async metrics() {
    const [users, subscriptions, audit] = await Promise.all([this.accounts.list(), this.subscriptions.list(), this.audit.list({ limit: 5000 })]);
    const byPlan = {}; const byState = {};
    for (const item of subscriptions) { byPlan[item.planId] = (byPlan[item.planId] || 0) + 1; byState[item.state] = (byState[item.state] || 0) + 1; }
    const active30d = users.filter(user => user.lastLoginAt && Date.now() - new Date(user.lastLoginAt).getTime() <= 30 * 86400000).length;
    return { users: users.length, active30d, subscriptions: subscriptions.length, byPlan, byState, auditEvents: audit.length, billingProviders: this.providers.health(), generatedAt: new Date().toISOString() };
  }
  async listUsers(options = {}) {
    const users = await this.accounts.list(); const subscriptions = await this.subscriptions.list();
    const query = String(options.query || '').toLowerCase();
    return users.filter(user => !query || `${user.email} ${user.displayName} ${user.role}`.toLowerCase().includes(query)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0, options.limit || 200).map(user => ({ ...publicUser(user), subscription: subscriptions.find(item => item.userId === user.id) || null }));
  }
  async setRole(actor, userId, role) {
    const target = await this.accounts.findById(userId); if (!target) throw new NotFoundError('User not found', { userId });
    const next = normalizeRole(role); if (!canManageRole(actor.role, target.role) || !canManageRole(actor.role, next)) throw new ValidationError('Role change is not permitted', { actorRole: actor.role, targetRole: target.role, next });
    const updated = await this.accounts.update(userId, current => ({ ...current, role: next }));
    await this.audit.record({ actorUserId: actor.id, actorRole: actor.role, action: 'ROLE_CHANGED', targetType: 'USER', targetId: userId, metadata: { from: target.role, to: next } });
    return publicUser(updated);
  }
  async setStatus(actor, userId, status) {
    const target = await this.accounts.findById(userId); if (!target) throw new NotFoundError('User not found', { userId });
    if (!canManageRole(actor.role, target.role)) throw new ValidationError('Account status change is not permitted');
    const normalized = String(status || '').toUpperCase(); if (!['ACTIVE','SUSPENDED','DISABLED'].includes(normalized)) throw new ValidationError('Status is invalid');
    const updated = await this.accounts.update(userId, current => ({ ...current, status: normalized }));
    if (normalized !== 'ACTIVE') await this.sessions.revokeUser(userId);
    await this.audit.record({ actorUserId: actor.id, actorRole: actor.role, action: 'ACCOUNT_STATUS_CHANGED', targetType: 'USER', targetId: userId, metadata: { status: normalized } });
    return publicUser(updated);
  }
}
