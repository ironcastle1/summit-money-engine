const STORAGE_KEY = 'merlin.workspaces.v1';
const ACTIVE_KEY = 'merlin.workspace.active.v1';
const MAX_WORKSPACES = 30;

function parse(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

function readAll() {
  const value = parse(localStorage.getItem(STORAGE_KEY), []);
  return Array.isArray(value) ? value : [];
}

function writeAll(workspaces) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces.slice(0, MAX_WORKSPACES)));
}

function id() {
  return globalThis.crypto?.randomUUID?.() || `workspace-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class WorkspaceRepository {
  list() { return readAll().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)); }

  get(workspaceId) { return readAll().find(item => item.id === workspaceId) || null; }

  save(input) {
    const now = new Date().toISOString();
    const all = readAll();
    const workspace = {
      id: input.id || id(),
      name: String(input.name || 'WORKSPACE').trim().slice(0, 60),
      state: input.state || {},
      createdAt: input.createdAt || now,
      updatedAt: now
    };
    const next = [workspace, ...all.filter(item => item.id !== workspace.id)];
    writeAll(next);
    localStorage.setItem(ACTIVE_KEY, workspace.id);
    return workspace;
  }

  remove(workspaceId) {
    writeAll(readAll().filter(item => item.id !== workspaceId));
    if (localStorage.getItem(ACTIVE_KEY) === workspaceId) localStorage.removeItem(ACTIVE_KEY);
  }

  activeId() { return localStorage.getItem(ACTIVE_KEY); }
  setActive(workspaceId) { workspaceId ? localStorage.setItem(ACTIVE_KEY, workspaceId) : localStorage.removeItem(ACTIVE_KEY); }

  import(value) {
    const items = Array.isArray(value) ? value : Array.isArray(value?.workspaces) ? value.workspaces : [];
    const existing = readAll();
    const merged = [...items, ...existing].filter(item => item && item.id && item.name && item.state);
    const unique = [...new Map(merged.map(item => [item.id, item])).values()];
    writeAll(unique);
    return unique.length;
  }

  export() { return { version: 1, exportedAt: new Date().toISOString(), workspaces: this.list() }; }
}
