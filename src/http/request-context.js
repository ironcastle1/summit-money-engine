import { URL } from 'node:url';
import { requestId as createRequestId } from '../core/ids.js';

function remoteAddress(request) {
  const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || request.socket.remoteAddress || 'unknown';
}

export function createRequestContext(request, baseUrl = 'http://localhost') {
  const id = createRequestId(request.headers['x-request-id']);
  const url = new URL(request.url || '/', baseUrl);
  return Object.freeze({
    id,
    method: String(request.method || 'GET').toUpperCase(),
    url,
    path: url.pathname,
    query: url.searchParams,
    ip: remoteAddress(request),
    userAgent: String(request.headers['user-agent'] || ''),
    startedAt: performance.now()
  });
}
