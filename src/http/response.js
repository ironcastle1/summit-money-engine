import { ApplicationError } from '../core/errors.js';

export function setCommonHeaders(response, requestId) {
  response.setHeader('x-content-type-options', 'nosniff');
  response.setHeader('x-frame-options', 'DENY');
  response.setHeader('x-permitted-cross-domain-policies', 'none');
  response.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
  response.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=(self), payment=(self), usb=(), serial=(), bluetooth=()');
  response.setHeader('cross-origin-resource-policy', 'same-site');
  response.setHeader('cross-origin-opener-policy', 'same-origin-allow-popups');
  response.setHeader('content-security-policy', "default-src 'self'; script-src 'self' https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; img-src 'self' data: blob: https:; connect-src 'self'; worker-src 'self' blob:; manifest-src 'self'; font-src 'self' data: https://unpkg.com https://cdn.jsdelivr.net; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests");
  response.setHeader('x-request-id', requestId);
}

export function sendJson(response, statusCode, body, options = {}) {
  if (response.writableEnded) return;
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('cache-control', options.cacheControl || 'no-store');
  response.end(JSON.stringify(body));
}

export function sendText(response, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  if (response.writableEnded) return;
  response.statusCode = statusCode;
  response.setHeader('content-type', contentType);
  response.end(body);
}


export function sendBuffer(response, statusCode, body, contentType = 'application/octet-stream', options = {}) {
  if (response.writableEnded) return;
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body || '');
  response.statusCode = statusCode;
  response.setHeader('content-type', contentType);
  response.setHeader('content-length', buffer.length);
  response.setHeader('cache-control', options.cacheControl || 'public, max-age=86400, stale-while-revalidate=604800');
  if (options.etag) response.setHeader('etag', options.etag);
  response.end(buffer);
}

export function sendNoContent(response, statusCode = 204) {
  if (response.writableEnded) return;
  response.statusCode = statusCode;
  response.end();
}

export function errorPayload(error, requestId) {
  const applicationError = error instanceof ApplicationError ? error : new ApplicationError('Internal server error', { cause: error });
  return {
    statusCode: applicationError.statusCode,
    body: { error: { code: applicationError.code, message: applicationError.expose ? applicationError.message : 'Internal server error', details: applicationError.expose ? applicationError.details : null, requestId } },
    retryAfterSeconds: applicationError.retryAfterSeconds || null
  };
}
