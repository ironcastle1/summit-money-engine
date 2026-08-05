export class IngestionError extends Error {
  constructor(message, options = {}) {
    super(message, { cause: options.cause });
    this.name = 'IngestionError';
    this.code = options.code || 'INGESTION_ERROR';
    this.sourceId = options.sourceId || null;
    this.retryable = options.retryable ?? false;
    this.details = options.details || null;
  }
}

export class SourceContractError extends IngestionError {
  constructor(message, options = {}) {
    super(message, { ...options, code: 'SOURCE_CONTRACT_ERROR', retryable: false });
    this.name = 'SourceContractError';
  }
}

export class RecordValidationError extends IngestionError {
  constructor(message, options = {}) {
    super(message, { ...options, code: 'RECORD_VALIDATION_ERROR', retryable: false });
    this.name = 'RecordValidationError';
    this.issues = options.issues || [];
  }
}

export class SourceTimeoutError extends IngestionError {
  constructor(sourceId, timeoutMs) {
    super(`Source ${sourceId} exceeded ${timeoutMs}ms`, {
      code: 'SOURCE_TIMEOUT', sourceId, retryable: true, details: { timeoutMs }
    });
    this.name = 'SourceTimeoutError';
  }
}

export function errorSummary(error) {
  return Object.freeze({
    name: error?.name || 'Error',
    code: error?.code || 'UNEXPECTED_ERROR',
    message: String(error?.message || error || 'Unknown error').slice(0, 500),
    sourceId: error?.sourceId || null,
    retryable: Boolean(error?.retryable),
    details: error?.details || null
  });
}
