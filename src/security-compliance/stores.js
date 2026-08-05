import { OwnerSecurityStore } from './generic-store.js';
import { SECURITY_LIMITS } from './constants.js';

export class PolicyStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.policies }); } }
export class AssessmentStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.controls }); } }
export class EvidenceStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.evidence }); } }
export class AccessReviewStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.accessReviews }); } }
export class RiskStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.risks }); } }
export class VendorStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.vendors }); } }
export class DataInventoryStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.processingRecords }); } }
export class LegalHoldStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.processingRecords }); } }
export class SubjectRequestStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.subjectRequests }); } }
export class IncidentStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.incidents }); } }
export class VulnerabilityStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.vulnerabilities }); } }
export class FindingStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.vulnerabilities }); } }
export class ExceptionStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.exceptions }); } }
export class ApiKeyStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.apiKeys }); } }
export class SecretStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.secrets }); } }
export class AuditChainStore extends OwnerSecurityStore { constructor() { super({ maximum: SECURITY_LIMITS.auditEntries }); } }
