import { $, text } from '../ui/dom.js';
import { number } from '../ui/format.js';

function date(value) { return value ? new Date(value).toISOString().slice(0, 10) : 'N/A'; }
function escape(value) { const node = document.createElement('span'); node.textContent = String(value ?? ''); return node.innerHTML; }

export class AdminController {
  constructor(options) { this.api = options.api; this.bound = false; this.users = []; }
  bind() {
    if (this.bound) return; this.bound = true;
    $('#admin-refresh')?.addEventListener('click', () => this.load());
    $('#admin-user-search')?.addEventListener('input', event => this.loadUsers(event.target.value));
    $('#admin-users')?.addEventListener('click', event => this.handleUserAction(event));
  }
  async load() {
    this.bind();
    const [metrics, users, audit] = await Promise.all([this.api.adminMetrics(), this.api.adminUsers(), this.api.adminAudit({ limit: 100 })]);
    this.renderMetrics(metrics); this.users = users.users || []; this.renderUsers(); this.renderAudit(audit.events || []);
  }
  async loadUsers(query = '') { const result = await this.api.adminUsers({ q: query }); this.users = result.users || []; this.renderUsers(); }
  renderMetrics(value) {
    text('#admin-user-count', number(value.users || 0)); text('#admin-active-count', number(value.active30d || 0)); text('#admin-subscription-count', number(value.subscriptions || 0)); text('#admin-audit-count', number(value.auditEvents || 0));
    text('#admin-plan-mix', Object.entries(value.byPlan || {}).map(([key, count]) => `${key} ${count}`).join(' / ') || 'N/A');
    text('#admin-provider-state', Object.entries(value.billingProviders || {}).map(([key, provider]) => `${key.toUpperCase()} ${provider.state}`).join(' / ') || 'N/A');
  }
  renderUsers() {
    const target = $('#admin-users'); if (!target) return;
    target.innerHTML = this.users.map(user => `<div class="admin-user-row" data-user-id="${escape(user.id)}"><span><strong>${escape(user.displayName || user.email)}</strong><small>${escape(user.email)}</small></span><b>${escape(user.role)}</b><b>${escape(user.status)}</b><b>${escape(user.subscription?.planId || 'FREE')}</b><b>${escape(date(user.lastLoginAt))}</b><select data-admin-role><option>USER</option><option>ANALYST</option><option>ADMIN</option></select><select data-admin-plan><option>FREE</option><option>PRO</option><option>TEAM</option></select><button data-admin-action="role">ROLE</button><button data-admin-action="plan">PLAN</button><button data-admin-action="status">${user.status === 'ACTIVE' ? 'SUSPEND' : 'ACTIVATE'}</button></div>`).join('') || '<div class="empty-state">0 USERS</div>';
    for (const row of target.querySelectorAll('.admin-user-row')) {
      const user = this.users.find(item => item.id === row.dataset.userId); if (!user) continue;
      row.querySelector('[data-admin-role]').value = user.role;
      row.querySelector('[data-admin-plan]').value = user.subscription?.planId || 'FREE';
    }
  }
  renderAudit(events) {
    const target = $('#admin-audit'); if (!target) return;
    target.innerHTML = events.map(event => `<div class="admin-audit-row"><time>${escape(new Date(event.at).toISOString().replace('T',' ').slice(0,19))}</time><b>${escape(event.action)}</b><span>${escape(event.targetType || 'N/A')}</span><span>${escape(event.outcome)}</span></div>`).join('') || '<div class="empty-state">0 EVENTS</div>';
  }
  async handleUserAction(event) {
    const button = event.target.closest('[data-admin-action]'); if (!button) return;
    const row = button.closest('.admin-user-row'); const userId = row.dataset.userId; button.disabled = true;
    try {
      if (button.dataset.adminAction === 'role') await this.api.adminSetRole(userId, row.querySelector('[data-admin-role]').value);
      if (button.dataset.adminAction === 'plan') await this.api.adminGrantPlan(userId, { planId: row.querySelector('[data-admin-plan]').value, days: 31 });
      if (button.dataset.adminAction === 'status') { const user = this.users.find(item => item.id === userId); await this.api.adminSetStatus(userId, user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'); }
      await this.load();
    } finally { button.disabled = false; }
  }
}
