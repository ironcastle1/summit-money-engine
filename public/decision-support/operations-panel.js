import { bandClass, escapeHtml, number } from './format.js';

function dateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—';
}

function healthClass(health) {
  if (health === 'BREACHED' || health === 'ACK_BREACHED') return 'critical';
  if (health === 'AT_RISK') return 'urgent';
  if (health === 'CLOSED') return 'routine';
  return 'important';
}

export class OperationsPanel {
  constructor(root, api, options = {}) {
    this.root = root;
    this.api = api;
    this.onChanged = options.onChanged;
    this.data = { slas: [], slaSummary: {}, schedules: [], approvals: [], audit: [], auditVerification: null, tasks: [], decisions: [] };
    this.loading = false;
  }

  async load() {
    if (this.loading) return;
    this.loading = true;
    this.root.innerHTML = '<div class="decision-empty">LOADING OPERATIONAL CONTROLS…</div>';
    const results = await Promise.allSettled([
      this.api.listSlas(),
      this.api.listSchedules(),
      this.api.listApprovals(),
      this.api.listAudit({ limit: 100 }),
      this.api.listTasks(),
      this.api.listDecisions()
    ]);
    const value = (index, fallback) => results[index].status === 'fulfilled' ? results[index].value : fallback;
    const slaPayload = value(0, { slas: [], summary: {} });
    const schedulePayload = value(1, { schedules: [] });
    const approvalPayload = value(2, { approvals: [] });
    const auditPayload = value(3, { entries: [], verification: null });
    const taskPayload = value(4, { tasks: [] });
    const decisionPayload = value(5, { decisions: [] });
    this.data = {
      slas: slaPayload.slas || [],
      slaSummary: slaPayload.summary || {},
      schedules: schedulePayload.schedules || [],
      approvals: approvalPayload.approvals || [],
      audit: auditPayload.entries || [],
      auditVerification: auditPayload.verification || null,
      tasks: taskPayload.tasks || [],
      decisions: decisionPayload.decisions || []
    };
    this.loading = false;
    this.render();
  }

  async createSchedule() {
    const name = this.root.querySelector('[data-schedule-name]')?.value.trim() || 'Morning briefing';
    const time = this.root.querySelector('[data-schedule-time]')?.value || '08:00';
    await this.api.saveSchedule({ name, time, type: 'MORNING', days: ['MON', 'TUE', 'WED', 'THU', 'FRI'], timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', enabled: true });
    await this.load();
    this.onChanged?.();
  }

  async removeSchedule(id) {
    await this.api.removeSchedule(id);
    await this.load();
    this.onChanged?.();
  }

  async transitionSla(id, state) {
    await this.api.transitionSla(id, state);
    await this.load();
    this.onChanged?.();
  }

  async transitionApproval(id, state) {
    const note = state === 'REJECTED' ? window.prompt('Reason for rejection') || '' : '';
    await this.api.transitionApproval(id, state, note);
    await this.load();
    this.onChanged?.();
  }

  async transitionTask(id, status) {
    await this.api.transitionTask(id, status);
    await this.load();
    this.onChanged?.();
  }

  async transitionDecision(id, status) {
    const reason = window.prompt(`Reason for ${status.toLowerCase()}`) || '';
    await this.api.transitionDecision(id, status, reason);
    await this.load();
    this.onChanged?.();
  }

  renderSummary() {
    const summary = this.data.slaSummary;
    return `<div class="operations-summary">
      <article><span>SLA COMPLIANCE</span><strong>${number(summary.compliancePercent || 0, 1)}%</strong></article>
      <article><span>AT RISK</span><strong>${number(summary.atRisk || 0)}</strong></article>
      <article><span>BREACHED</span><strong>${number(summary.breached || 0)}</strong></article>
      <article><span>PENDING APPROVAL</span><strong>${number(this.data.approvals.filter(item => ['SUBMITTED', 'IN_REVIEW'].includes(item.state)).length)}</strong></article>
      <article><span>OPEN TASKS</span><strong>${number(this.data.tasks.filter(item => !['DONE', 'CANCELLED'].includes(item.status)).length)}</strong></article>
      <article><span>AUDIT CHAIN</span><strong>${this.data.auditVerification?.valid === false ? 'FAILED' : 'VALID'}</strong></article>
    </div>`;
  }

  renderSlas() {
    const rows = this.data.slas.slice(0, 50).map(item => `<article class="operation-row ${healthClass(item.health)}">
      <div><span>${escapeHtml(item.health)}</span><strong>${escapeHtml(item.signalId || item.id)}</strong><small>${escapeHtml(item.targetRole)} · due ${escapeHtml(dateTime(item.nextDueAt))}</small></div>
      <b>${number(item.remainingMinutes)}m</b>
      <div class="operation-actions">
        ${item.state === 'PENDING' ? `<button data-sla-action="ACKNOWLEDGED" data-sla-id="${escapeHtml(item.id)}">ACK</button>` : ''}
        ${!['RESOLVED', 'CANCELLED'].includes(item.state) ? `<button data-sla-action="RESOLVED" data-sla-id="${escapeHtml(item.id)}">RESOLVE</button>` : ''}
      </div>
    </article>`).join('');
    return `<section class="operation-section"><header><div><span>ESCALATION CONTROL</span><h3>SLA QUEUE</h3></div><b>${this.data.slas.length}</b></header><div class="operation-list">${rows || '<div class="decision-empty">0 ACTIVE SLA RECORDS</div>'}</div></section>`;
  }

  renderSchedules() {
    const rows = this.data.schedules.map(item => `<article class="operation-row ${item.enabled ? 'important' : 'routine'}">
      <div><span>${escapeHtml(item.type)}</span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.days.join(' '))} · ${escapeHtml(item.time)} ${escapeHtml(item.timezone)}</small></div>
      <b>${item.enabled ? 'ON' : 'OFF'}</b>
      <button data-schedule-remove="${escapeHtml(item.id)}">×</button>
    </article>`).join('');
    return `<section class="operation-section"><header><div><span>AUTOMATION</span><h3>BRIEFING SCHEDULES</h3></div><b>${this.data.schedules.length}</b></header>
      <div class="operation-form"><input data-schedule-name placeholder="SCHEDULE NAME"><input data-schedule-time type="time" value="08:00"><button data-schedule-create>ADD WEEKDAY BRIEF</button></div>
      <div class="operation-list">${rows || '<div class="decision-empty">0 SCHEDULES</div>'}</div></section>`;
  }

  renderApprovals() {
    const rows = this.data.approvals.slice(0, 50).map(item => `<article class="operation-row ${bandClass(item.state === 'REJECTED' ? 'CRITICAL' : item.state === 'APPROVED' ? 'IMPORTANT' : 'URGENT')}">
      <div><span>${escapeHtml(item.state)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.resourceType)} · ${escapeHtml(item.assignedTo)}</small></div>
      <div class="operation-actions">
        ${['DRAFT'].includes(item.state) ? `<button data-approval-action="SUBMITTED" data-approval-id="${escapeHtml(item.id)}">SUBMIT</button>` : ''}
        ${['SUBMITTED', 'IN_REVIEW'].includes(item.state) ? `<button data-approval-action="APPROVED" data-approval-id="${escapeHtml(item.id)}">APPROVE</button><button data-approval-action="REJECTED" data-approval-id="${escapeHtml(item.id)}">REJECT</button>` : ''}
      </div>
    </article>`).join('');
    return `<section class="operation-section"><header><div><span>GOVERNANCE</span><h3>APPROVAL QUEUE</h3></div><b>${this.data.approvals.length}</b></header><div class="operation-list">${rows || '<div class="decision-empty">0 APPROVAL REQUESTS</div>'}</div></section>`;
  }

  renderTasksAndDecisions() {
    const tasks = this.data.tasks.slice(0, 30).map(item => `<article class="operation-row ${bandClass(item.priority >= 85 ? 'CRITICAL' : item.priority >= 70 ? 'URGENT' : 'IMPORTANT')}">
      <div><span>${escapeHtml(item.status)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.owner)} · due ${escapeHtml(dateTime(item.dueAt))}</small></div>
      <b>${number(item.priority)}</b>
      <div class="operation-actions">${!['DONE', 'CANCELLED'].includes(item.status) ? `<button data-task-action="DONE" data-task-id="${escapeHtml(item.id)}">DONE</button>` : ''}</div>
    </article>`).join('');
    const decisions = this.data.decisions.slice(0, 30).map(item => `<article class="operation-row ${item.status === 'REJECTED' ? 'critical' : item.status === 'APPROVED' ? 'important' : 'urgent'}">
      <div><span>${escapeHtml(item.status)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.owner)} · ${escapeHtml(item.caseId || 'NO CASE')}</small></div>
      <div class="operation-actions">
        ${item.status === 'PROPOSED' ? `<button data-decision-action="APPROVED" data-decision-id="${escapeHtml(item.id)}">APPROVE</button><button data-decision-action="REJECTED" data-decision-id="${escapeHtml(item.id)}">REJECT</button>` : ''}
        ${item.status === 'APPROVED' ? `<button data-decision-action="COMPLETED" data-decision-id="${escapeHtml(item.id)}">COMPLETE</button>` : ''}
      </div>
    </article>`).join('');
    return `<section class="operation-section operation-split"><div><header><div><span>DELIVERY</span><h3>TASKS</h3></div><b>${this.data.tasks.length}</b></header><div class="operation-list">${tasks || '<div class="decision-empty">0 TASKS</div>'}</div></div><div><header><div><span>GOVERNANCE</span><h3>DECISIONS</h3></div><b>${this.data.decisions.length}</b></header><div class="operation-list">${decisions || '<div class="decision-empty">0 DECISIONS</div>'}</div></div></section>`;
  }

  renderAudit() {
    const rows = this.data.audit.slice(0, 50).map(item => `<article class="audit-row"><time>${escapeHtml(dateTime(item.time))}</time><b>${escapeHtml(item.action)}</b><span>${escapeHtml(item.resourceType)} ${escapeHtml(item.resourceId)}</span><small>${escapeHtml(item.actor)}</small></article>`).join('');
    return `<section class="operation-section"><header><div><span>TAMPER-EVIDENT RECORD</span><h3>AUDIT TRAIL</h3></div><b>${this.data.auditVerification?.valid === false ? 'INVALID' : 'VALID'}</b></header><div class="audit-list">${rows || '<div class="decision-empty">0 AUDIT EVENTS</div>'}</div></section>`;
  }

  bind() {
    this.root.querySelector('[data-schedule-create]')?.addEventListener('click', () => this.createSchedule());
    this.root.querySelectorAll('[data-schedule-remove]').forEach(button => button.addEventListener('click', () => this.removeSchedule(button.dataset.scheduleRemove)));
    this.root.querySelectorAll('[data-sla-action]').forEach(button => button.addEventListener('click', () => this.transitionSla(button.dataset.slaId, button.dataset.slaAction)));
    this.root.querySelectorAll('[data-approval-action]').forEach(button => button.addEventListener('click', () => this.transitionApproval(button.dataset.approvalId, button.dataset.approvalAction)));
    this.root.querySelectorAll('[data-task-action]').forEach(button => button.addEventListener('click', () => this.transitionTask(button.dataset.taskId, button.dataset.taskAction)));
    this.root.querySelectorAll('[data-decision-action]').forEach(button => button.addEventListener('click', () => this.transitionDecision(button.dataset.decisionId, button.dataset.decisionAction)));
  }

  render() {
    this.root.innerHTML = `<div class="operations-panel">${this.renderSummary()}${this.renderSlas()}${this.renderSchedules()}${this.renderApprovals()}${this.renderTasksAndDecisions()}${this.renderAudit()}</div>`;
    this.bind();
  }
}
