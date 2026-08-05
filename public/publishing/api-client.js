export function createPublishingApi(options = {}) {
  const timeoutMs = Math.max(1000, Number(options.timeoutMs) || 15000);
  async function request(path, init = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(path, { ...init, headers: { 'content-type': 'application/json', ...(init.headers || {}) }, signal: controller.signal });
      if (!response.ok) throw new Error(`${path} ${response.status}`);
      const type = response.headers.get('content-type') || '';
      return type.includes('application/json') ? response.json() : response.text();
    } finally { clearTimeout(timer); }
  }
  return Object.freeze({
    snapshot: () => request('/api/publishing/snapshot'),
    catalog: () => request('/api/publishing/catalog'),
    seed: () => request('/api/publishing/seed', { method: 'POST', body: '{}' }),
    createEdition: body => request('/api/publishing/editions', { method: 'POST', body: JSON.stringify(body) }),
    approveEdition: body => request('/api/publishing/editions/approve', { method: 'POST', body: JSON.stringify(body) }),
    publishEdition: body => request('/api/publishing/editions/publish', { method: 'POST', body: JSON.stringify(body) }),
    deliverEdition: body => request('/api/publishing/editions/deliver', { method: 'POST', body: JSON.stringify(body) }),
    previewEdition: body => request('/api/publishing/editions/preview', { method: 'POST', body: JSON.stringify(body) }),
    createPublication: body => request('/api/publishing/publications', { method: 'POST', body: JSON.stringify(body) }),
    createSubscriber: body => request('/api/publishing/subscribers', { method: 'POST', body: JSON.stringify(body) }),
    createAudience: body => request('/api/publishing/audiences', { method: 'POST', body: JSON.stringify(body) }),
    createShare: body => request('/api/publishing/share', { method: 'POST', body: JSON.stringify(body) })
  });
}
