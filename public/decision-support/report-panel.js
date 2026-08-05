import { escapeHtml } from './format.js';

const REPORT_TYPES = Object.freeze(['EXECUTIVE', 'MORNING', 'SHIFT_HANDOVER', 'INCIDENT', 'MARKET', 'COUNTRY', 'ROUTE']);

export class ReportPanel {
  constructor(root, api) {
    this.root = root;
    this.api = api;
    this.report = null;
    this.snapshot = null;
  }

  renderLauncher(snapshot) {
    this.snapshot = snapshot;
    this.root.innerHTML = `<section class="report-launcher"><header><span>CONTROLLED OUTPUT</span><h2>REPORT BUILDER</h2></header>
      <div class="report-controls"><label><span>REPORT TYPE</span><select data-report-type>${REPORT_TYPES.map(type => `<option value="${type}">${type.replaceAll('_', ' ')}</option>`).join('')}</select></label><label><span>CLASSIFICATION</span><select data-report-classification><option>INTERNAL</option><option>CONFIDENTIAL</option><option>RESTRICTED</option><option>PUBLIC</option></select></label><button data-report-generate type="button">GENERATE REPORT</button></div>
      <div data-report-output><div class="decision-empty">SELECT A TEMPLATE AND GENERATE A REPORT FROM THE CURRENT SNAPSHOT.</div></div></section>`;
    this.output = this.root.querySelector('[data-report-output]');
    this.root.querySelector('[data-report-generate]')?.addEventListener('click', () => this.generate());
  }

  async generate() {
    if (!this.snapshot) return;
    const type = this.root.querySelector('[data-report-type]')?.value || 'EXECUTIVE';
    const classification = this.root.querySelector('[data-report-classification]')?.value || 'INTERNAL';
    this.output.innerHTML = '<div class="decision-empty">GENERATING REPORT…</div>';
    try {
      this.report = await this.api.report({ snapshot: this.snapshot, type, classification });
      this.renderReport();
    } catch (error) {
      this.output.innerHTML = `<div class="decision-empty">REPORT FAILED: ${escapeHtml(error.message || error)}</div>`;
    }
  }

  download(extension, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `merlin-${this.report?.type?.toLowerCase() || 'report'}-${Date.now()}.${extension}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async evaluateDistribution() {
    const recipients = window.prompt('Recipient addresses, comma separated') || '';
    if (!recipients.trim()) return;
    const result = await this.api.distribute({
      resourceType: 'REPORT',
      resourceId: this.report.id,
      contentClassification: this.report.classification,
      policy: { classification: this.report.classification, allowedRoles: ['ANALYST', 'APPROVER'], requireApproval: this.report.classification !== 'PUBLIC', allowExternal: this.report.classification === 'PUBLIC' },
      actorRoles: ['ANALYST'],
      recipients: recipients.split(',').map(value => value.trim()).filter(Boolean),
      organisationDomains: [location.hostname],
      approvalState: this.report.status === 'APPROVED' ? 'APPROVED' : 'DRAFT',
      content: this.report
    });
    window.alert(result.evaluation.allowed ? 'Distribution policy passed.' : `Distribution blocked: ${result.evaluation.reasons.join('; ')}`);
  }

  renderReport() {
    if (!this.report) return;
    const warnings = this.report.qualityGate?.warnings || [];
    this.output.innerHTML = `<article class="report-preview"><header><div><span>${escapeHtml(this.report.type)} · ${escapeHtml(this.report.classification)}</span><h2>${escapeHtml(this.report.title)}</h2></div><b>${this.report.qualityGate?.ready ? 'READY' : 'REVIEW'}</b></header>
      <p>${escapeHtml(this.report.executive?.headline || '')}</p>
      ${warnings.length ? `<div class="report-warnings">${warnings.map(item => `<p>${escapeHtml(item)}</p>`).join('')}</div>` : ''}
      <h3>RECOMMENDATIONS</h3><ol>${(this.report.recommendations || []).map(item => `<li><strong>${escapeHtml(item.priority)}</strong> ${escapeHtml(item.action)}</li>`).join('')}</ol>
      <div class="report-actions"><button data-report-json>JSON</button><button data-report-markdown>MARKDOWN</button><button data-report-distribute>CHECK DISTRIBUTION</button><button data-report-print>PRINT</button></div></article>`;
    this.output.querySelector('[data-report-json]')?.addEventListener('click', () => this.download('json', JSON.stringify(this.report, null, 2), 'application/json'));
    this.output.querySelector('[data-report-markdown]')?.addEventListener('click', () => this.download('md', `# ${this.report.title}\n\n${this.report.executive?.headline || ''}\n\n${(this.report.recommendations || []).map(item => `- ${item.action}`).join('\n')}`, 'text/markdown'));
    this.output.querySelector('[data-report-distribute]')?.addEventListener('click', () => this.evaluateDistribution());
    this.output.querySelector('[data-report-print]')?.addEventListener('click', () => window.print());
  }
}
