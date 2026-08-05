export class LogisticsError extends Error {
  constructor(code, message, details = null, statusCode = 400) {
    super(message);
    this.name = 'LogisticsError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }
}
export function logisticsError(code, message, details, statusCode) { return new LogisticsError(code, message, details, statusCode); }
export function assertLogistics(condition, code, message, details, statusCode = 400) {
  if (!condition) throw new LogisticsError(code, message, details, statusCode);
}
export function notFound(entity, id) { return new LogisticsError(`${String(entity).toUpperCase()}_NOT_FOUND`, `${entity} not found`, { id }, 404); }
