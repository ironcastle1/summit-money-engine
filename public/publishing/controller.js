import { createPublishingApi } from './api-client.js';
import { PublishingState } from './state-store.js';
import { renderPublishingDashboard } from './dashboard.js';
import { renderPublicationTable } from './publication-table.js';
import { renderEditionPanel } from './edition-panel.js';
import { renderAudiencePanel } from './audience-panel.js';
import { renderDeliveryPanel } from './delivery-panel.js';
import { renderTemplatePanel } from './template-panel.js';
import { renderAnalyticsPanel } from './analytics-panel.js';
import { renderSharePanel } from './share-panel.js';

export class PublishingController {
  constructor(options = {}) {
    this.api = options.api || createPublishingApi();
    this.state = options.state || new PublishingState();
    this.snapshot = null;
    this.loading = false;
  }

  async activate() {
    document.querySelector('#sheet-kicker').textContent = 'REPORTS / CLIENT DELIVERY / SECURE SHARING';
    document.querySelector('#sheet-title').textContent = 'PUBLISHING';
    await this.refresh();
  }

  async refresh() {
    if (this.loading) return;
    this.loading = true;
    try {
      this.snapshot = await this.api.snapshot();
      if (!this.snapshot.publications?.length) {
        await this.api.seed();
        this.snapshot = await this.api.snapshot();
      }
      this.render();
    } catch (error) {
      document.querySelector('#sheet-content').innerHTML = `<div class="publishing-error">Publishing load failed: ${error.message}</div>`;
    } finally { this.loading = false; }
  }

  render() {
    const summary = document.querySelector('#sheet-summary');
    const content = document.querySelector('#sheet-content');
    renderPublishingDashboard(summary, this.snapshot);
    content.innerHTML = '<div id="publishing-publications"></div><div id="publishing-editions"></div><div id="publishing-audiences"></div><div id="publishing-deliveries"></div><div id="publishing-templates"></div><div id="publishing-analytics"></div><div id="publishing-shares"></div>';
    const value = this.state.get();
    renderPublicationTable(document.querySelector('#publishing-publications'), this.snapshot.publications, value.query);
    renderEditionPanel(document.querySelector('#publishing-editions'), this.snapshot.editions, value.selectedEditionId);
    renderAudiencePanel(document.querySelector('#publishing-audiences'), this.snapshot);
    renderDeliveryPanel(document.querySelector('#publishing-deliveries'), this.snapshot.deliveries);
    renderTemplatePanel(document.querySelector('#publishing-templates'), this.snapshot);
    renderAnalyticsPanel(document.querySelector('#publishing-analytics'), this.snapshot);
    renderSharePanel(document.querySelector('#publishing-shares'), this.snapshot.shares);
    this.bind();
  }

  bind() {
    document.querySelectorAll('[data-publication-id]').forEach(button => button.addEventListener('click', () => { this.state.set({ selectedPublicationId: button.dataset.publicationId }); this.render(); }));
    document.querySelectorAll('[data-edition-id]').forEach(button => button.addEventListener('click', () => { this.state.set({ selectedEditionId: button.dataset.editionId }); this.render(); }));
    document.querySelector('[data-action="new-publication"]')?.addEventListener('click', async () => { await this.api.createPublication({ name: `New publication ${new Date().toLocaleDateString()}`, state: 'DRAFT', cadence: 'AD_HOC' }); await this.refresh(); });
    document.querySelector('[data-action="generate-edition"]')?.addEventListener('click', async () => { const publicationId = this.state.get().selectedPublicationId || this.snapshot.publications[0]?.id; if (publicationId) { await this.api.createEdition({ publicationId }); await this.refresh(); } });
    document.querySelectorAll('[data-action="approve-edition"]').forEach(button => button.addEventListener('click', async () => { await this.api.approveEdition({ id: button.dataset.id, state: 'APPROVED' }); await this.refresh(); }));
    document.querySelectorAll('[data-action="publish-edition"]').forEach(button => button.addEventListener('click', async () => { await this.api.publishEdition({ id: button.dataset.id, overrideQuality: true }); await this.refresh(); }));
    document.querySelectorAll('[data-action="deliver-edition"]').forEach(button => button.addEventListener('click', async () => { await this.api.deliverEdition({ editionId: button.dataset.id, channels: ['IN_APP', 'SECURE_LINK'] }); await this.refresh(); }));
    document.querySelectorAll('[data-action="preview-edition"]').forEach(button => button.addEventListener('click', async () => { const preview = await this.api.previewEdition({ id: button.dataset.id, approvalRequired: false, requireSources: false }); const popup = window.open('', '_blank'); if (popup) { popup.document.open(); popup.document.write(preview.html); popup.document.close(); } }));
    document.querySelector('[data-action="new-subscriber"]')?.addEventListener('click', async () => { await this.api.createSubscriber({ name: `In-app reader ${this.snapshot.subscribers.length + 1}`, channels: ['IN_APP'], clearance: 'CLIENT' }); await this.refresh(); });
  }
}
