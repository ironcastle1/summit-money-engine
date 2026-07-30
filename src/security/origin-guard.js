import { ForbiddenError } from '../core/errors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function requestOrigin(request) {
  const explicit = request.headers.origin;
  if (explicit) return explicit;
  const referer = request.headers.referer;
  if (!referer) return null;
  try { return new URL(referer).origin; } catch { return null; }
}

export function verifyRequestOrigin(request, context, options = {}) {
  if (SAFE_METHODS.has(context.method)) return;
  if (options.exemptPaths?.some(path => context.path.startsWith(path))) return;
  const origin = requestOrigin(request);
  if (!origin) return;
  const allowed = new Set(options.allowedOrigins || []);
  const hostOrigin = `${options.protocol || 'http'}://${request.headers.host || ''}`;
  allowed.add(hostOrigin);
  if (!allowed.has(origin)) throw new ForbiddenError('Cross-origin state change rejected', { origin, code: 'ORIGIN_REJECTED' });
}
