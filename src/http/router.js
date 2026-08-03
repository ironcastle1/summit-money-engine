import { NotFoundError } from '../core/errors.js';

function compilePath(pattern) {
  const keys = [];
  const escaped = pattern
    .split('/')
    .map(segment => {
      if (!segment) return '';
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return { regex: new RegExp(`^${escaped}/?$`), keys };
}

export class Router {
  #routes = [];

  register(method, pattern, handler) {
    const compiled = compilePath(pattern);
    this.#routes.push({ method: method.toUpperCase(), pattern, handler, ...compiled });
    return this;
  }

  get(pattern, handler) {
    return this.register('GET', pattern, handler);
  }

  post(pattern, handler) {
    return this.register('POST', pattern, handler);
  }

  async dispatch(request, response, context) {
    for (const route of this.#routes) {
      if (route.method !== context.method) continue;
      const match = context.path.match(route.regex);
      if (!match) continue;
      const params = Object.fromEntries(route.keys.map((key, index) => [key, decodeURIComponent(match[index + 1])]));
      return route.handler({ request, response, context, params });
    }
    throw new NotFoundError('Route not found', { method: context.method, path: context.path });
  }

  list() {
    return this.#routes.map(({ method, pattern }) => ({ method, pattern }));
  }
}
