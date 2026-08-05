import { RecordValidationError } from './errors.js';

function normalizeIssues(result) {
  if (result === true || result === undefined) return [];
  if (result === false) return [{ path: '', code: 'INVALID', message: 'Record failed validation' }];
  if (Array.isArray(result)) return result;
  if (result?.issues) return result.issues;
  return [];
}

export class SchemaRegistry {
  #schemas = new Map();

  register(recordType, schemaVersion, validator) {
    const type = String(recordType || '').trim().toLowerCase();
    const version = Math.max(1, Math.floor(Number(schemaVersion || 1)));
    if (!type) throw new TypeError('recordType is required');
    if (typeof validator !== 'function') throw new TypeError('validator must be a function');
    const key = `${type}@${version}`;
    if (this.#schemas.has(key)) throw new Error(`Schema already registered: ${key}`);
    this.#schemas.set(key, validator);
    return this;
  }

  has(recordType, schemaVersion = 1) {
    return this.#schemas.has(`${String(recordType).toLowerCase()}@${Number(schemaVersion)}`);
  }

  validate(envelope, options = {}) {
    const key = `${envelope.recordType}@${envelope.schemaVersion}`;
    const validator = this.#schemas.get(key);
    if (!validator) {
      if (options.allowUnknown ?? true) return { valid: true, issues: [], schema: null };
      throw new RecordValidationError(`No schema registered for ${key}`);
    }
    const issues = normalizeIssues(validator(envelope.record, envelope));
    return { valid: issues.length === 0, issues, schema: key };
  }

  assert(envelope, options = {}) {
    const result = this.validate(envelope, options);
    if (!result.valid) throw new RecordValidationError(`Record failed ${result.schema || 'schema'} validation`, { issues: result.issues });
    return envelope;
  }

  list() {
    return [...this.#schemas.keys()].sort().map(key => {
      const [recordType, version] = key.split('@');
      return { recordType, schemaVersion: Number(version) };
    });
  }
}
