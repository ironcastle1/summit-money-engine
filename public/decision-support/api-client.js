export function createDecisionSupportApi(options = {}) {
  const timeoutMs = Math.max(1000, Number(options.timeoutMs) || 12_000);

  async function request(path, init = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(path, {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          accept: 'application/json',
          ...(init.body ? { 'content-type': 'application/json' } : {}),
          ...(init.headers || {})
        },
        ...init,
        signal: init.signal || controller.signal
      });
      const contentType = response.headers.get('content-type') || '';
      const body = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text();
      if (!response.ok) throw new Error(body?.error?.message || `HTTP ${response.status}`);
      return body;
    } finally {
      clearTimeout(timer);
    }
  }

  const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body || {}) });
  const query = params => new URLSearchParams(Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== '' && value !== null));

  return Object.freeze({
    catalog: () => request('/api/decision-support/catalog'),
    diagnostics: () => request('/api/decision-support/diagnostics'),
    snapshot: params => {
      const payload = params || {};
      if (payload.bundle || payload.watchlists?.length || payload.force) return post('/api/decision-support/snapshot', payload);
      return request(`/api/decision-support/snapshot?${query(payload)}`);
    },
    report: body => post('/api/decision-support/report', body),
    handover: body => post('/api/decision-support/handover', body),
    digest: body => post('/api/decision-support/digest', body),
    distribute: body => post('/api/decision-support/distribution/evaluate', body),

    listWorkspaces: params => request(`/api/decision-support/workspaces?${query(params)}`),
    saveWorkspace: body => post('/api/decision-support/workspaces', body),
    removeWorkspace: id => post('/api/decision-support/workspaces/remove', { id }),

    listCases: params => request(`/api/decision-support/cases?${query(params)}`),
    getCase: id => request(`/api/decision-support/cases/${encodeURIComponent(id)}`),
    saveCase: body => post('/api/decision-support/cases', body),
    transitionCase: (id, status, extra = {}) => post('/api/decision-support/cases/transition', { id, status, ...extra }),
    removeCase: id => post('/api/decision-support/cases/remove', { id }),

    listNotes: (caseId, params = {}) => request(`/api/decision-support/notes?${query({ caseId, ...params })}`),
    saveNote: body => post('/api/decision-support/notes', body),
    removeNote: id => post('/api/decision-support/notes/remove', { id }),

    listTasks: (caseId, params = {}) => request(`/api/decision-support/tasks?${query({ caseId, ...params })}`),
    saveTask: body => post('/api/decision-support/tasks', body),
    transitionTask: (id, status, extra = {}) => post('/api/decision-support/tasks/transition', { id, status, ...extra }),

    listDecisions: (caseId, params = {}) => request(`/api/decision-support/decisions?${query({ caseId, ...params })}`),
    saveDecision: body => post('/api/decision-support/decisions', body),
    transitionDecision: (id, status, reason = '') => post('/api/decision-support/decisions/transition', { id, status, reason }),

    listSlas: params => request(`/api/decision-support/slas?${query(params)}`),
    createSla: body => post('/api/decision-support/slas', body),
    transitionSla: (id, state, extra = {}) => post('/api/decision-support/slas/transition', { id, state, ...extra }),

    listSchedules: params => request(`/api/decision-support/schedules?${query(params)}`),
    dueSchedules: now => request(`/api/decision-support/schedules/due?${query({ now })}`),
    saveSchedule: body => post('/api/decision-support/schedules', body),
    removeSchedule: id => post('/api/decision-support/schedules/remove', { id }),

    listApprovals: params => request(`/api/decision-support/approvals?${query(params)}`),
    createApproval: body => post('/api/decision-support/approvals', body),
    transitionApproval: (id, state, note = '') => post('/api/decision-support/approvals/transition', { id, state, note }),

    listAudit: params => request(`/api/decision-support/audit?${query(params)}`),
    verifyAudit: () => request('/api/decision-support/audit/verify')
  });
}
