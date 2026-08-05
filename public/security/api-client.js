export function createSecurityApi(options = {}) {
  const timeoutMs = Math.max(1000, Number(options.timeoutMs) || 12000);
  async function request(path, init = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(path, { ...init, signal: controller.signal, headers: { 'content-type': 'application/json', ...(init.headers || {}) } });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error?.message || `Security API ${response.status}`);
      }
      return response.json();
    } finally {
      clearTimeout(timer);
    }
  }
  return Object.freeze({
    snapshot: () => request('/api/security/snapshot'),
    seed: input => request('/api/security/seed', { method: 'POST', body: JSON.stringify(input || {}) }),
    diagnostics: () => request('/api/security/diagnostics'),
    access: input => request('/api/security/access/evaluate', { method: 'POST', body: JSON.stringify(input) }),
    policy: input => request('/api/security/policies', { method: 'POST', body: JSON.stringify(input) }),
    risk: input => request('/api/security/risks', { method: 'POST', body: JSON.stringify(input) }),
    incident: input => request('/api/security/incidents', { method: 'POST', body: JSON.stringify(input) }),
    vulnerability: input => request('/api/security/vulnerabilities', { method: 'POST', body: JSON.stringify(input) }),
    evidence: input => request('/api/security/evidence', { method: 'POST', body: JSON.stringify(input) }),
    export: input => request('/api/security/export', { method: 'POST', body: JSON.stringify(input) })
  });
}
