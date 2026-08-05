export function createWebhookChannel(options = {}) { const fetchImpl = options.fetchImpl || globalThis.fetch; return async (notification) => { if (!notification.endpoint)
    return Object.freeze({ channel: 'WEBHOOK', state: 'UNAVAILABLE', reason: 'No webhook endpoint configured' }); if (!fetchImpl)
    return Object.freeze({ channel: 'WEBHOOK', state: 'UNAVAILABLE', reason: 'Fetch unavailable' }); try {
    const response = await fetchImpl(notification.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(notification) });
    return Object.freeze({ channel: 'WEBHOOK', state: response.ok ? 'DELIVERED' : 'FAILED', status: response.status });
}
catch (error) {
    return Object.freeze({ channel: 'WEBHOOK', state: 'FAILED', reason: String(error.message || error) });
} }; }
