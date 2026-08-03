function encode(value) { return encodeURIComponent(String(value)); }

export function parseCookies(header) {
  return Object.fromEntries(String(header || '').split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const index = part.indexOf('=');
    if (index < 0) return [part, ''];
    const key = part.slice(0, index).trim();
    const raw = part.slice(index + 1);
    try { return [key, decodeURIComponent(raw)]; } catch { return [key, raw]; }
  }));
}

export function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encode(value)}`];
  parts.push(`Path=${options.path || '/'}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.expires) parts.push(`Expires=${new Date(options.expires).toUTCString()}`);
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  parts.push(`SameSite=${options.sameSite || 'Lax'}`);
  return parts.join('; ');
}

export function clearCookie(name, options = {}) {
  return serializeCookie(name, '', { ...options, maxAge: 0, expires: new Date(0) });
}
