import { createAuditEvent } from '../domain/accounts/audit-event.js';
export class AuditService {
  constructor(repository) { this.repository = repository; }
  async record(input) { return this.repository.append(createAuditEvent(input)); }
  async list(options) { return this.repository.list(options); }
}
