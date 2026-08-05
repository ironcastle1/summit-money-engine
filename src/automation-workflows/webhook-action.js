import { interpolateValue } from './template-engine.js';
export function createWebhookAction(options = {}) { const fetchImpl = options.fetchImpl || globalThis.fetch; return async (action, context) => { const configuration = interpolateValue(action.configuration, context); if (!configuration.url)
    throw new TypeError('Webhook action requires a URL'); const url = new URL(configuration.url); if (!['https:', 'http:'].includes(url.protocol))
    throw new TypeError('Webhook URL must use HTTP or HTTPS'); if (!fetchImpl)
    throw new Error('Fetch implementation unavailable'); const response = await fetchImpl(url, { method: configuration.method || 'POST', headers: { 'content-type': 'application/json', ...(configuration.headers || {}) }, body: JSON.stringify(configuration.body || { workflowId: context.workflowId, runId: context.runId, signal: context.signal }) }); if (!response.ok)
    throw new Error(`Webhook returned HTTP ${response.status}`); return Object.freeze({ type: 'WEBHOOK', status: response.status, url: url.origin }); }; }
