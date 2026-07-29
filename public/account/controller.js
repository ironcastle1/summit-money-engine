import { $, $$, text } from '../ui/dom.js';
import { CloudSync } from './cloud-sync.js';
import { AdminController } from '../admin/controller.js';

function date(value) { return value ? new Date(value).toISOString().slice(0, 10) : 'N/A'; }
function money(plan) { return plan.amountMinor === 0 ? '£0' : `£${(plan.amountMinor / 100).toFixed(0)}`; }
function roleLevel(role) { return ['USER','ANALYST','ADMIN','OWNER'].indexOf(role || 'USER'); }

export class AccountController {
  constructor(options) { this.api = options.api; this.store = options.store; this.sync = new CloudSync(this.api); this.admin = new AdminController({ api: this.api }); this.initialized = false; this.bound = false; this.session = null; this.plans = []; }
  bind() {
    if (this.bound) return; this.bound = true;
    $('#auth-login')?.addEventListener('submit', event => this.login(event));
    $('#auth-register')?.addEventListener('submit', event => this.register(event));
    $('#account-logout')?.addEventListener('click', () => this.logout());
    $('#profile-form')?.addEventListener('submit', event => this.profile(event));
    $('#password-form')?.addEventListener('submit', event => this.password(event));
    $('#billing-provider')?.addEventListener('change', () => this.renderPlans());
    $('#billing-plans')?.addEventListener('click', event => this.checkout(event));
    $('#cloud-sync-rows')?.addEventListener('click', event => this.syncAction(event));
    $('#cloud-refresh')?.addEventListener('click', () => this.renderSync());
  }
  async ensureInitialized(force = false) {
    this.bind(); if (this.initialized && !force) return;
    const [session, plans] = await Promise.all([this.api.authSession(), this.api.billingPlans()]);
    this.session = session; this.plans = plans.plans || []; this.providers = plans.providers || {};
    this.api.setCsrfToken(session.csrfToken || null); this.store.setState({ account: session }, 'account.session'); this.render(); this.initialized = true;
  }
  setStatus(value, bad = false) { const node = $('#account-message'); if (!node) return; node.textContent = value; node.classList.toggle('error', bad); }
  async login(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget); this.setStatus('AUTHENTICATING');
    try { this.session = await this.api.login({ email: form.get('email'), password: form.get('password') }); this.api.setCsrfToken(this.session.csrfToken); this.initialized = true; this.render(); this.setStatus('AUTHENTICATED'); }
    catch (error) { this.setStatus(`${error.code} / ${error.message}`, true); }
  }
  async register(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget); this.setStatus('CREATING');
    try { this.session = await this.api.register({ email: form.get('email'), password: form.get('password'), displayName: form.get('displayName') }); this.api.setCsrfToken(this.session.csrfToken); this.initialized = true; this.render(); this.setStatus('ACTIVE'); }
    catch (error) { this.setStatus(`${error.code} / ${error.message}`, true); }
  }
  async logout() { try { await this.api.logout(); } finally { this.api.setCsrfToken(null); this.session = { authenticated: false }; this.render(); } }
  async profile(event) { event.preventDefault(); const form = new FormData(event.currentTarget); const result = await this.api.updateProfile({ displayName: form.get('displayName') }); this.session.user = result.user; this.renderIdentity(); this.setStatus('PROFILE SAVED'); }
  async password(event) { event.preventDefault(); const form = new FormData(event.currentTarget); try { await this.api.changePassword({ currentPassword: form.get('currentPassword'), nextPassword: form.get('nextPassword') }); this.setStatus('PASSWORD CHANGED / LOGIN REQUIRED'); await this.logout().catch(() => {}); } catch (error) { this.setStatus(`${error.code} / ${error.message}`, true); } }
  render() {
    const authenticated = Boolean(this.session?.authenticated);
    $('#account-anonymous')?.classList.toggle('hidden', authenticated); $('#account-authenticated')?.classList.toggle('hidden', !authenticated);
    text('#account-nav-state', authenticated ? this.session.entitlements?.planId || 'FREE' : 'SIGN IN');
    if (!authenticated) return;
    this.renderIdentity(); this.renderPlans(); this.renderSync();
    const admin = roleLevel(this.session.user.role) >= roleLevel('ADMIN'); $('#account-admin')?.classList.toggle('hidden', !admin); if (admin) this.admin.load();
  }
  renderIdentity() {
    const { user, subscription, entitlements } = this.session;
    text('#account-name', user.displayName || user.email); text('#account-email', user.email); text('#account-role', user.role); text('#account-plan', entitlements.planId); text('#account-sub-state', subscription?.state || 'NONE'); text('#account-renewal', date(subscription?.currentPeriodEnd));
    text('#account-api-limit', entitlements.limits.apiRequestsPerDay?.toLocaleString() || 'N/A'); text('#account-alert-limit', entitlements.limits.alertRules?.toLocaleString() || 'N/A'); text('#account-workspace-limit', entitlements.limits.workspaces?.toLocaleString() || 'N/A');
    const field = $('#profile-display-name'); if (field) field.value = user.displayName || '';
  }
  renderPlans() {
    const target = $('#billing-plans'); if (!target) return; const providerId = $('#billing-provider')?.value || 'stripe'; const provider = this.providers?.[providerId];
    target.innerHTML = this.plans.map(plan => `<article class="billing-plan ${this.session?.entitlements?.planId === plan.id ? 'current' : ''}"><header><span>${plan.id}</span><strong>${money(plan)}</strong><small>/${plan.interval.toUpperCase()}</small></header><div><b>${plan.limits.alertRules}</b><span>ALERTS</span><b>${plan.limits.workspaces}</b><span>WORKSPACES</span><b>${plan.limits.exportsPerDay}</b><span>EXPORTS/D</span></div><button type="button" data-plan-id="${plan.id}" ${plan.id === 'FREE' || !provider?.configured ? 'disabled' : ''}>${this.session?.entitlements?.planId === plan.id ? 'CURRENT' : 'SELECT'}</button></article>`).join('');
    text('#billing-provider-state', provider ? provider.state : 'N/A');
  }
  async checkout(event) { const button = event.target.closest('[data-plan-id]'); if (!button || button.disabled) return; button.disabled = true; try { const result = await this.api.createCheckout({ planId: button.dataset.planId, provider: $('#billing-provider').value }); if (result.url) location.assign(result.url); } catch (error) { this.setStatus(`${error.code} / ${error.message}`, true); button.disabled = false; } }
  async renderSync() {
    if (!this.session?.authenticated) return; const target = $('#cloud-sync-rows'); if (!target) return; target.innerHTML = '<div class="empty-state">LOADING</div>';
    const rows = await Promise.all(this.sync.buckets().map(bucket => this.sync.status(bucket).catch(() => ({ bucket, local: this.sync.count(this.sync.local(bucket)), remote: 'N/A' }))));
    target.innerHTML = rows.map(row => `<div class="cloud-sync-row" data-bucket="${row.bucket}"><b>${row.bucket.toUpperCase()}</b><span>${row.local}</span><span>${row.remote}</span><button data-sync="push">PUSH</button><button data-sync="pull">PULL</button><button data-sync="merge">MERGE</button></div>`).join('');
  }
  async syncAction(event) { const button = event.target.closest('[data-sync]'); if (!button) return; const row = button.closest('[data-bucket]'); button.disabled = true; try { await this.sync[button.dataset.sync](row.dataset.bucket); await this.renderSync(); this.setStatus(`${row.dataset.bucket.toUpperCase()} ${button.dataset.sync.toUpperCase()} OK`); } catch (error) { this.setStatus(`${error.code} / ${error.message}`, true); } finally { button.disabled = false; } }
}
