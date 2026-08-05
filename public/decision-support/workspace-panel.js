import { escapeHtml } from './format.js';

export class WorkspacePanel {
  constructor(root, api, onLoad) {
    this.root = root;
    this.api = api;
    this.onLoad = onLoad;
    this.items = [];
    this.snapshot = null;
  }

  async load(snapshot = this.snapshot) {
    this.snapshot = snapshot;
    this.root.innerHTML = '<div class="decision-empty">LOADING WORKSPACES…</div>';
    try {
      this.items = (await this.api.listWorkspaces()).workspaces || [];
    } catch {
      this.items = [];
    }
    this.render();
  }

  async save() {
    if (!this.snapshot) return;
    const name = this.root.querySelector('[data-workspace-name]')?.value.trim() || `Workspace ${this.items.length + 1}`;
    const state = {
      minimumPriority: Number(document.querySelector('[data-decision-priority]')?.value || 45),
      hours: Number(document.querySelector('[data-decision-hours]')?.value || 72)
    };
    await this.api.saveWorkspace({
      name,
      description: this.snapshot.brief?.executive?.headline || 'Saved decision-support workspace',
      filters: state,
      views: [{ type: 'brief', generatedAt: this.snapshot.generatedAt, selectedSignalIds: (this.snapshot.signals || []).slice(0, 25).map(item => item.id) }],
      tags: ['decision-support']
    });
    await this.load(this.snapshot);
  }

  async remove(id) {
    await this.api.removeWorkspace(id);
    await this.load(this.snapshot);
  }

  render() {
    this.root.innerHTML = `<div class="workspace-form"><input data-workspace-name placeholder="WORKSPACE NAME"><button data-workspace-save type="button">SAVE CURRENT</button></div>
      <div class="workspace-list">${this.items.map(item => `<article><button data-workspace-load="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.description || 'Saved analysis state')}</span><small>${item.caseIds?.length || 0} cases · ${item.views?.length || 0} views</small></button><button data-workspace-remove="${escapeHtml(item.id)}" aria-label="Remove workspace">×</button></article>`).join('') || '<div class="decision-empty">0 SERVER WORKSPACES</div>'}</div>`;
    this.root.querySelector('[data-workspace-save]')?.addEventListener('click', () => this.save());
    this.root.querySelectorAll('[data-workspace-load]').forEach(button => button.addEventListener('click', () => this.onLoad?.(this.items.find(item => item.id === button.dataset.workspaceLoad))));
    this.root.querySelectorAll('[data-workspace-remove]').forEach(button => button.addEventListener('click', () => this.remove(button.dataset.workspaceRemove)));
  }
}
