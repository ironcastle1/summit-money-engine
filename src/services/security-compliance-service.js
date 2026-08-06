import {
  PolicyStore,
  AssessmentStore,
  EvidenceStore,
  AccessReviewStore,
  RiskStore,
  VendorStore,
  DataInventoryStore,
  LegalHoldStore,
  SubjectRequestStore,
  IncidentStore,
  VulnerabilityStore,
  FindingStore,
  ExceptionStore,
  ApiKeyStore,
  SecretStore,
  securityCatalog,
  policyRecord,
  controlAssessment,
  evidenceRecord,
  accessReviewRecord,
  riskRecord,
  vendorRiskRecord,
  dataInventoryRecord,
  legalHoldRecord,
  subjectRequestRecord,
  incidentRecord,
  vulnerabilityRecord,
  findingRecord,
  exceptionRecord,
  apiKeyRecord,
  secretRecord,
  accessDecision,
  complianceScore,
  securityPosture,
  securityDiagnostics,
  appendAuditEvent,
  verifyAuditChain,
  frameworkReport,
  securityJson,
  securityCsv,
  securitySummary,
  remediationSla,
  breachClock,
  keyRotationStatus,
  evaluateRetention,
  ssoPosture,
  encryptionPosture,
  segregationConflicts,
  orphanAccess,
  processingAgreementStatus,
  residencyDecision,
  responsePlaybook,
  iso,
  SECURITY_CONTROLS
} from '../security-compliance/index.js';

function required(value, name) {
  if (!value) throw new TypeError(`${name} not found`);
  return value;
}

export class SecurityComplianceService {
  constructor(options = {}) {
    this.commercial = options.commercial || null;
    this.accountAudit = options.audit || null;
    this.policies = new PolicyStore();
    this.assessments = new AssessmentStore();
    this.evidence = new EvidenceStore();
    this.accessReviews = new AccessReviewStore();
    this.risks = new RiskStore();
    this.vendors = new VendorStore();
    this.dataInventory = new DataInventoryStore();
    this.legalHolds = new LegalHoldStore();
    this.subjectRequests = new SubjectRequestStore();
    this.incidents = new IncidentStore();
    this.vulnerabilities = new VulnerabilityStore();
    this.findings = new FindingStore();
    this.exceptions = new ExceptionStore();
    this.apiKeys = new ApiKeyStore();
    this.secrets = new SecretStore();
    this.auditChains = new Map();
    this.identityPosture = new Map();
  }

  catalog() {
    return securityCatalog();
  }

  chain(owner) {
    const key = String(owner || 'anonymous');
    if (!this.auditChains.has(key)) this.auditChains.set(key, Object.freeze([]));
    return this.auditChains.get(key);
  }

  async recordAudit(owner, input = {}) {
    const chain = appendAuditEvent(this.chain(owner), input);
    this.auditChains.set(String(owner || 'anonymous'), chain);
    if (this.accountAudit?.record) {
      await this.accountAudit.record({
        actorUserId: input.actorId || owner,
        action: `security.${String(input.action || 'event').toLowerCase()}`,
        targetType: input.resourceType || 'security',
        targetId: input.resourceId || null,
        metadata: { outcome: input.outcome || 'SUCCESS' }
      }).catch(() => null);
    }
    return chain[chain.length - 1];
  }

  async createPolicy(owner, input) {
    const record = policyRecord(input);
    await this.policies.put(owner, record);
    await this.recordAudit(owner, { tenantId: record.tenantId, actorId: owner, action: 'POLICY_CREATED', resourceType: 'POLICY', resourceId: record.id });
    return record;
  }

  async assessControl(owner, input) {
    const record = controlAssessment(input);
    await this.assessments.put(owner, record);
    await this.recordAudit(owner, { tenantId: record.tenantId, actorId: owner, action: 'CONTROL_ASSESSED', resourceType: 'CONTROL', resourceId: record.controlId });
    return record;
  }

  async addEvidence(owner, input) {
    const record = evidenceRecord(input);
    await this.evidence.put(owner, record);
    await this.recordAudit(owner, { tenantId: record.tenantId, actorId: owner, action: 'EVIDENCE_ADDED', resourceType: 'EVIDENCE', resourceId: record.id });
    return record;
  }

  async createAccessReview(owner, input) {
    const record = accessReviewRecord(input);
    await this.accessReviews.put(owner, record);
    return record;
  }

  async createRisk(owner, input) {
    const record = riskRecord(input);
    await this.risks.put(owner, record);
    return record;
  }

  async createVendor(owner, input) {
    const record = vendorRiskRecord(input);
    await this.vendors.put(owner, record);
    return record;
  }

  async createDataRecord(owner, input) {
    const record = dataInventoryRecord(input);
    await this.dataInventory.put(owner, record);
    return record;
  }

  async createLegalHold(owner, input) {
    const record = legalHoldRecord(input);
    await this.legalHolds.put(owner, record);
    return record;
  }

  async createSubjectRequest(owner, input) {
    const record = subjectRequestRecord(input);
    await this.subjectRequests.put(owner, record);
    return record;
  }

  async createIncident(owner, input) {
    const record = incidentRecord(input);
    await this.incidents.put(owner, record);
    await this.recordAudit(owner, { tenantId: record.tenantId, actorId: owner, action: 'INCIDENT_DECLARED', resourceType: 'INCIDENT', resourceId: record.id, reason: record.summary });
    return Object.freeze({ incident: record, breachClock: breachClock(record), playbook: responsePlaybook(input.playbookType || 'DATA_EXPOSURE') });
  }

  async createVulnerability(owner, input) {
    const record = vulnerabilityRecord(input);
    const sla = remediationSla(record);
    const complete = Object.freeze({ ...record, dueAt: record.dueAt || sla.dueAt });
    await this.vulnerabilities.put(owner, complete);
    return Object.freeze({ vulnerability: complete, sla: remediationSla(complete) });
  }

  async createFinding(owner, input) {
    const record = findingRecord(input);
    await this.findings.put(owner, record);
    return record;
  }

  async createException(owner, input) {
    const record = exceptionRecord(input);
    await this.exceptions.put(owner, record);
    return record;
  }

  async createApiKey(owner, input) {
    const record = apiKeyRecord(input);
    await this.apiKeys.put(owner, record);
    await this.recordAudit(owner, { tenantId: record.tenantId, actorId: owner, action: 'API_KEY_CREATED', resourceType: 'API_KEY', resourceId: record.id });
    return record;
  }

  async createSecret(owner, input) {
    const record = secretRecord(input);
    await this.secrets.put(owner, record);
    return Object.freeze({ ...record, rotation: keyRotationStatus(record) });
  }

  async evaluateAccess(owner, input) {
    const decision = accessDecision(input);
    await this.recordAudit(owner, {
      tenantId: input.resource?.tenantId,
      actorId: input.subject?.id || owner,
      action: 'ACCESS_DECISION',
      resourceType: input.resource?.type || 'RESOURCE',
      resourceId: input.resource?.id,
      outcome: decision.decision,
      reason: decision.reasons.join(',')
    });
    return decision;
  }

  setIdentityPosture(owner, input = {}) {
    const value = Object.freeze({
      sso: ssoPosture(input.sso || {}),
      encryption: encryptionPosture(input.encryption || {}),
      updatedAt: iso()
    });
    this.identityPosture.set(String(owner || 'anonymous'), value);
    return value;
  }

  identity(owner) {
    return this.identityPosture.get(String(owner || 'anonymous')) || this.setIdentityPosture(owner, {
      sso: { enabled: false },
      encryption: { atRest: true, inTransit: true, minimumTlsVersion: 1.2, keyRotationEnabled: true }
    });
  }

  async governance(owner) {
    const [records, holds, vendors, requests, secrets] = await Promise.all([
      this.dataInventory.list(owner),
      this.legalHolds.list(owner),
      this.vendors.list(owner),
      this.subjectRequests.list(owner),
      this.secrets.list(owner)
    ]);
    return Object.freeze({
      records: Object.freeze(records.map(record => ({ record, retention: evaluateRetention(record, holds) }))),
      legalHolds: holds,
      vendors: Object.freeze(vendors.map(vendor => ({ ...vendor, agreement: processingAgreementStatus({ vendorId: vendor.id, signedAt: vendor.signedAt, processingPurpose: vendor.service, dataCategories: vendor.dataCategories, subprocessors: vendor.subprocessors, usesSubprocessors: vendor.subprocessors.length > 0, internationalTransfer: vendor.regions.some(region => !['UK', 'EEA'].includes(region)), transferMechanism: vendor.transferMechanism }) }))),
      subjectRequests: requests,
      secretRotation: Object.freeze(secrets.map(keyRotationStatus))
    });
  }

  async posture(owner) {
    const snapshot = await this.snapshotData(owner);
    const compliance = complianceScore(snapshot);
    const criticalVulnerabilities = snapshot.vulnerabilities.filter(item => item.state !== 'CLOSED' && item.severity === 'CRITICAL').length;
    const accessScore = Math.max(0, 100 - snapshot.accessReviews.filter(item => item.state !== 'COMPLETE').length * 8);
    const vulnerabilityScore = Math.max(0, 100 - criticalVulnerabilities * 15 - snapshot.vulnerabilities.filter(item => remediationSla(item).state === 'BREACHED').length * 5);
    const incidentReadiness = Math.max(0, 100 - snapshot.incidents.filter(item => item.state !== 'CLOSED' && item.state !== 'RESOLVED').length * 10);
    const dataGovernanceScore = Math.max(0, 100 - snapshot.dataInventory.filter(item => !item.retentionScheduleId).length * 10);
    const vendorScore = Math.max(0, 100 - snapshot.vendors.filter(item => item.residualRisk >= 60).length * 10);
    return Object.freeze({
      compliance,
      posture: securityPosture({ complianceScore: compliance.score, accessScore, vulnerabilityScore, incidentReadiness, dataGovernanceScore, vendorScore, criticalVulnerabilities, openCriticalFindings: snapshot.findings.filter(item => item.state !== 'CLOSED' && item.severity === 'CRITICAL').length })
    });
  }

  async snapshotData(owner) {
    const [policies, assessments, evidence, accessReviews, risks, vendors, dataInventory, legalHolds, subjectRequests, incidents, vulnerabilities, findings, exceptions, apiKeys, secrets] = await Promise.all([
      this.policies.list(owner), this.assessments.list(owner), this.evidence.list(owner), this.accessReviews.list(owner), this.risks.list(owner), this.vendors.list(owner), this.dataInventory.list(owner), this.legalHolds.list(owner), this.subjectRequests.list(owner), this.incidents.list(owner), this.vulnerabilities.list(owner), this.findings.list(owner), this.exceptions.list(owner), this.apiKeys.list(owner), this.secrets.list(owner)
    ]);
    return { policies, assessments, evidence, accessReviews, risks, vendors, dataInventory, legalHolds, subjectRequests, incidents, vulnerabilities, findings, exceptions, apiKeys, secrets };
  }

  async snapshot(owner) {
    const data = await this.snapshotData(owner);
    const scored = await this.postureFromData(data);
    const auditVerification = verifyAuditChain(this.chain(owner));
    const identity = this.identity(owner);
    const governance = await this.governance(owner);
    const diagnostics = securityDiagnostics({ ...data, auditVerification });
    return Object.freeze({ generatedAt: iso(), ...data, ...scored, audit: this.chain(owner), auditVerification, identity, governance, diagnostics });
  }

  async postureFromData(data) {
    const compliance = complianceScore(data);
    const criticalVulnerabilities = data.vulnerabilities.filter(item => item.state !== 'CLOSED' && item.severity === 'CRITICAL').length;
    const posture = securityPosture({
      complianceScore: compliance.score,
      accessScore: Math.max(0, 100 - data.accessReviews.filter(item => item.state !== 'COMPLETE').length * 8),
      vulnerabilityScore: Math.max(0, 100 - criticalVulnerabilities * 15),
      incidentReadiness: Math.max(0, 100 - data.incidents.filter(item => !['RESOLVED', 'CLOSED'].includes(item.state)).length * 10),
      dataGovernanceScore: Math.max(0, 100 - data.dataInventory.filter(item => !item.retentionScheduleId).length * 10),
      vendorScore: Math.max(0, 100 - data.vendors.filter(item => item.residualRisk >= 60).length * 10),
      criticalVulnerabilities,
      openCriticalFindings: data.findings.filter(item => item.state !== 'CLOSED' && item.severity === 'CRITICAL').length
    });
    return { compliance, posture };
  }

  async report(owner, frameworkId) {
    return frameworkReport(frameworkId, await this.snapshotData(owner));
  }

  async diagnostics(owner) {
    const snapshot = await this.snapshot(owner);
    return snapshot.diagnostics;
  }

  async seed(owner, input = {}) {
    if ((await this.policies.count(owner)) > 0) return this.snapshot(owner);
    const tenantId = input.tenantId || 'tenant-merlin-demo';
    await this.createPolicy(owner, { id: 'policy-information-security', tenantId, name: 'Information Security Policy', category: 'SECURITY', state: 'APPROVED', ownerId: owner, approverIds: [owner], controlIds: ['GOV-03', 'IAM-02', 'OPS-02'], summary: 'Defines Merlin security governance, access control, incident response and evidence requirements.', approvedAt: iso() });
    for (const control of SECURITY_CONTROLS.slice(0, 12)) {
      const evidence = await this.addEvidence(owner, { tenantId, controlId: control.id, title: `${control.name} operating evidence`, source: 'MERLIN_RUNTIME', ownerTeam: 'PLATFORM' });
      await this.assessControl(owner, { tenantId, controlId: control.id, frameworkIds: ['ISO27001', 'SOC2'], designScore: 85, operationScore: 80, evidenceScore: 90, evidenceIds: [evidence.id], assessorId: owner });
    }
    await this.createAccessReview(owner, { id: 'review-quarterly-access', tenantId, name: 'Quarterly privileged access review', reviewerIds: [owner], assignments: [{ userId: owner, role: 'OWNER', resourceId: tenantId, decision: 'APPROVE' }] });
    await this.createRisk(owner, { id: 'risk-source-dependency', tenantId, title: 'External source dependency', category: 'RESILIENCE', likelihood: 45, impact: 70, velocity: 40, controlStrength: 60, ownerId: owner, treatment: 'Multiple source adapters, circuit breakers and cached fallbacks.' });
    await this.createVendor(owner, { id: 'vendor-cloud-host', tenantId, name: 'Primary cloud hosting', service: 'Application hosting and data processing', criticality: 'HIGH', dataCategories: ['CUSTOMER_DATA', 'SECURITY_LOGS'], regions: ['UK'], certifications: ['ISO27001'], inherentRisk: 70, controlStrength: 80, signedAt: iso(), transferMechanism: 'ADEQUACY' });
    await this.createDataRecord(owner, { id: 'data-customer-operations', tenantId, name: 'Customer operations data', system: 'MERLIN', ownerTeam: 'PLATFORM', classification: 'CONFIDENTIAL', categories: ['ACCOUNT', 'USAGE', 'SUPPORT'], dataSubjects: ['CUSTOMERS', 'USERS'], purposes: ['SERVICE_DELIVERY', 'SECURITY'], legalBasis: 'CONTRACT', region: 'UK', retentionScheduleId: 'CUSTOMER_DATA', processors: ['vendor-cloud-host'] });
    await this.createSecret(owner, { id: 'secret-session-signing', tenantId, name: 'Session signing key', system: 'MERLIN', ownerTeam: 'PLATFORM', storage: 'ENVIRONMENT', rotationDays: 90 });
    await this.createFinding(owner, { id: 'finding-compliance-expansion', tenantId, title: 'Complete remaining framework mappings', description: 'Extend operating evidence across the full control catalogue before external audit.', source: 'INTERNAL_REVIEW', severity: 'MEDIUM', state: 'OPEN', controlIds: ['GOV-04'], ownerId: owner });
    this.setIdentityPosture(owner, { sso: { enabled: true, protocol: 'SAML2', enforceForAdmins: true, signedAssertions: true, certificateExpiresAt: new Date(Date.now() + 180 * 86400000).toISOString(), jitProvisioning: true, defaultRole: 'VIEWER' }, encryption: { atRest: true, inTransit: true, minimumTlsVersion: 1.3, keyRotationEnabled: true } });
    await this.recordAudit(owner, { tenantId, actorId: owner, action: 'SECURITY_PLATFORM_SEEDED', resourceType: 'PLATFORM', resourceId: 'security-compliance' });
    return this.snapshot(owner);
  }

  async export(owner, input = {}) {
    const snapshot = await this.snapshot(owner);
    const format = String(input.format || 'JSON').toUpperCase();
    if (format === 'CSV') {
      const dataset = String(input.dataset || 'risks');
      const rows = Array.isArray(snapshot[dataset]) ? snapshot[dataset] : [];
      return Object.freeze({ contentType: 'text/csv; charset=utf-8', extension: 'csv', body: securityCsv(rows) });
    }
    if (format === 'SUMMARY') return Object.freeze({ contentType: 'text/plain; charset=utf-8', extension: 'txt', body: securitySummary(snapshot) });
    return Object.freeze({ contentType: 'application/json; charset=utf-8', extension: 'json', body: securityJson(snapshot) });
  }

  async analysis(owner, input = {}) {
    const snapshot = await this.snapshot(owner);
    return Object.freeze({
      access: accessDecision(input.access || { subject: { tenantId: input.tenantId, role: 'VIEWER', clearance: 'INTERNAL' }, resource: { tenantId: input.tenantId, classification: 'INTERNAL' }, permission: 'security:read', context: { mfaSatisfied: true } }),
      segregationConflicts: segregationConflicts(input.assignments || []),
      orphanAccess: orphanAccess(input.assignments || [], input.users || []),
      residency: residencyDecision(input.residency || { sourceRegion: 'UK', targetRegion: 'EEA', classification: 'CONFIDENTIAL' }),
      snapshot
    });
  }
}

export function createSecurityComplianceService(options = {}) {
  return new SecurityComplianceService(options);
}
