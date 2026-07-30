export class ApplicationError extends Error {
  constructor(message, options = {}) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.code = options.code || 'APPLICATION_ERROR';
    this.statusCode = options.statusCode || 500;
    this.details = options.details || null;
    this.expose = options.expose ?? this.statusCode < 500;
  }
}

export class ValidationError extends ApplicationError {
  constructor(message, details = null) {
    super(message, { code: 'VALIDATION_ERROR', statusCode: 400, details, expose: true });
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message = 'Not found', details = null) {
    super(message, { code: 'NOT_FOUND', statusCode: 404, details, expose: true });
  }
}

export class RateLimitError extends ApplicationError {
  constructor(retryAfterSeconds) {
    super('Rate limit exceeded', {
      code: 'RATE_LIMITED',
      statusCode: 429,
      details: { retryAfterSeconds },
      expose: true
    });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class UpstreamError extends ApplicationError {
  constructor(message, options = {}) {
    super(message, {
      code: options.code || 'UPSTREAM_ERROR',
      statusCode: options.statusCode || 502,
      details: options.details,
      cause: options.cause,
      expose: false
    });
    this.upstream = options.upstream || null;
  }
}

export class ConfigurationError extends ApplicationError {
  constructor(message, details = null) {
    super(message, { code: 'CONFIGURATION_ERROR', statusCode: 500, details, expose: false });
  }
}


export class UnauthorizedError extends ApplicationError {
  constructor(message = 'Authentication required', details = null) {
    super(message, { code: 'UNAUTHORIZED', statusCode: 401, details, expose: true });
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message = 'Forbidden', details = null) {
    super(message, { code: 'FORBIDDEN', statusCode: 403, details, expose: true });
  }
}

export class ConflictError extends ApplicationError {
  constructor(message = 'Conflict', details = null) {
    super(message, { code: 'CONFLICT', statusCode: 409, details, expose: true });
  }
}
