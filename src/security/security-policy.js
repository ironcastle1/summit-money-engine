const DEFAULT_SCRIPT_HOSTS = Object.freeze(['https://unpkg.com', 'https://cdn.jsdelivr.net']);
const DEFAULT_STYLE_HOSTS = Object.freeze(['https://unpkg.com', 'https://cdn.jsdelivr.net']);

function joinDirective(name, values) {
  return `${name} ${[...new Set(values)].join(' ')}`;
}

export function buildContentSecurityPolicy(options = {}) {
  const development = options.environment !== 'production';
  const scriptHosts = ["'self'", ...DEFAULT_SCRIPT_HOSTS, ...(options.scriptHosts || [])];
  const styleHosts = ["'self'", "'unsafe-inline'", ...DEFAULT_STYLE_HOSTS, ...(options.styleHosts || [])];
  const connectHosts = ["'self'", ...(options.connectHosts || [])];
  if (development && options.allowDevelopmentWebSocket) connectHosts.push('ws:', 'wss:');

  return [
    joinDirective('default-src', ["'self'"]),
    joinDirective('script-src', scriptHosts),
    joinDirective('style-src', styleHosts),
    joinDirective('img-src', ["'self'", 'data:', 'blob:', 'https:']),
    joinDirective('connect-src', connectHosts),
    joinDirective('worker-src', ["'self'", 'blob:']),
    joinDirective('manifest-src', ["'self'"]),
    joinDirective('font-src', ["'self'", 'data:', ...DEFAULT_STYLE_HOSTS]),
    joinDirective('frame-ancestors', ["'none'"]),
    joinDirective('base-uri', ["'self'"]),
    joinDirective('form-action', ["'self'"]),
    joinDirective('object-src', ["'none'"]),
    'upgrade-insecure-requests'
  ].join('; ');
}

export function applySecurityHeaders(response, options = {}) {
  response.setHeader('x-content-type-options', 'nosniff');
  response.setHeader('x-frame-options', 'DENY');
  response.setHeader('x-permitted-cross-domain-policies', 'none');
  response.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
  response.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=(self), payment=(self), usb=(), serial=(), bluetooth=()');
  response.setHeader('cross-origin-resource-policy', 'same-site');
  response.setHeader('cross-origin-opener-policy', 'same-origin-allow-popups');
  response.setHeader('content-security-policy', buildContentSecurityPolicy(options));
  if (options.isProduction) response.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
}
