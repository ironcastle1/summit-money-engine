export function createReliabilityApi(options = {}) {
    const base = options.baseUrl || '';
    async function request(path, init = {}) {
        const response = await fetch(`${base}${path}`, { headers: { 'content-type': 'application/json', ...(init.headers || {}) }, ...init });
        const text = await response.text();
        const body = text ? JSON.parse(text) : {};
        if (!response.ok)
            throw new Error(body.error?.message || `Operations API ${response.status}`);
        return body;
    }
    return Object.freeze({ snapshot: () => request('/api/operations/snapshot'), seed: () => request('/api/operations/seed', { method: 'POST', body: '{}' }), incident: input => request('/api/operations/incidents', { method: 'POST', body: JSON.stringify(input) }), release: input => request('/api/operations/releases', { method: 'POST', body: JSON.stringify(input) }), measurement: input => request('/api/operations/measurements', { method: 'POST', body: JSON.stringify(input) }), restoreTest: input => request('/api/operations/restore-tests', { method: 'POST', body: JSON.stringify(input) }), capacity: input => request('/api/operations/capacity/recommend', { method: 'POST', body: JSON.stringify(input) }) });
}
