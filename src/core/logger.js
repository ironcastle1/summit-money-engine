const LEVELS = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40, fatal: 50 });

function serializeError(error) {
  if (!(error instanceof Error)) return error;
  return {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack,
    cause: error.cause instanceof Error ? serializeError(error.cause) : error.cause
  };
}

function sanitize(value, seen = new WeakSet()) {
  if (value instanceof Error) return serializeError(value);
  if (Array.isArray(value)) return value.map(item => sanitize(item, seen));
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  const output = {};
  for (const [key, entry] of Object.entries(value)) {
    const lower = key.toLowerCase();
    output[key] = lower.includes('key') || lower.includes('token') || lower.includes('secret')
      ? '[REDACTED]'
      : sanitize(entry, seen);
  }
  return output;
}

export function createLogger(options = {}) {
  const threshold = LEVELS[options.level] ?? LEVELS.info;
  const base = Object.freeze({ service: options.service || 'application', ...(options.base || {}) });

  const write = (level, event, fields = {}) => {
    if ((LEVELS[level] ?? LEVELS.info) < threshold) return;
    const record = {
      timestamp: new Date().toISOString(),
      level,
      event,
      ...base,
      ...sanitize(fields)
    };
    const line = JSON.stringify(record);
    if (level === 'error' || level === 'fatal') process.stderr.write(`${line}\n`);
    else process.stdout.write(`${line}\n`);
  };

  return Object.freeze({
    debug: (event, fields) => write('debug', event, fields),
    info: (event, fields) => write('info', event, fields),
    warn: (event, fields) => write('warn', event, fields),
    error: (event, fields) => write('error', event, fields),
    fatal: (event, fields) => write('fatal', event, fields),
    child(fields = {}) {
      return createLogger({ level: options.level, service: base.service, base: { ...base, ...fields } });
    }
  });
}
