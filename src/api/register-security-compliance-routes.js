import { readJsonBody } from '../http/body.js';
import { sendJson } from '../http/response.js';
import { boundedString } from '../core/validation.js';

function owner(context) {
  return String(context?.user?.id || context?.session?.userId || 'anonymous');
}

function query(context, key, fallback = '') {
  return context?.query?.get(key) ?? fallback;
}

export function registerSecurityComplianceRoutes(router, services) {
  const security = services.securityCompliance;
  router.get('/api/security/catalog', async ({ response }) => sendJson(response, 200, security.catalog()));
  router.get('/api/security/diagnostics', async ({ response, context }) => sendJson(response, 200, await security.diagnostics(owner(context))));
  router.get('/api/security/snapshot', async ({ response, context }) => sendJson(response, 200, await security.snapshot(owner(context))));
  router.post('/api/security/seed', async ({ request, response, context }) => sendJson(response, 201, await security.seed(owner(context), await readJsonBody(request).catch(() => ({})))));
  router.post('/api/security/access/evaluate', async ({ request, response, context }) => sendJson(response, 200, await security.evaluateAccess(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
  router.post('/api/security/identity/posture', async ({ request, response, context }) => sendJson(response, 200, security.setIdentityPosture(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
  router.post('/api/security/analysis', async ({ request, response, context }) => sendJson(response, 200, await security.analysis(owner(context), await readJsonBody(request, { maximumBytes: 2000000 }))));

  router.get('/api/security/policies', async ({ response, context }) => sendJson(response, 200, { policies: await security.policies.list(owner(context), { tenantId: query(context, 'tenantId'), state: query(context, 'state'), q: query(context, 'q'), limit: query(context, 'limit') }) }));
  router.post('/api/security/policies', async ({ request, response, context }) => sendJson(response, 201, await security.createPolicy(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
  router.get('/api/security/assessments', async ({ response, context }) => sendJson(response, 200, { assessments: await security.assessments.list(owner(context), { tenantId: query(context, 'tenantId'), controlId: query(context, 'controlId'), state: query(context, 'state'), q: query(context, 'q') }) }));
  router.post('/api/security/assessments', async ({ request, response, context }) => sendJson(response, 201, await security.assessControl(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
  router.get('/api/security/evidence', async ({ response, context }) => sendJson(response, 200, { evidence: await security.evidence.list(owner(context), { tenantId: query(context, 'tenantId'), controlId: query(context, 'controlId'), state: query(context, 'state'), q: query(context, 'q') }) }));
  router.post('/api/security/evidence', async ({ request, response, context }) => sendJson(response, 201, await security.addEvidence(owner(context), await readJsonBody(request, { maximumBytes: 2000000 }))));
  router.get('/api/security/access-reviews', async ({ response, context }) => sendJson(response, 200, { reviews: await security.accessReviews.list(owner(context), { tenantId: query(context, 'tenantId'), state: query(context, 'state'), q: query(context, 'q') }) }));
  router.post('/api/security/access-reviews', async ({ request, response, context }) => sendJson(response, 201, await security.createAccessReview(owner(context), await readJsonBody(request, { maximumBytes: 2000000 }))));
  router.get('/api/security/risks', async ({ response, context }) => sendJson(response, 200, { risks: await security.risks.list(owner(context), { tenantId: query(context, 'tenantId'), state: query(context, 'state'), q: query(context, 'q') }) }));
  router.post('/api/security/risks', async ({ request, response, context }) => sendJson(response, 201, await security.createRisk(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
  router.get('/api/security/vendors', async ({ response, context }) => sendJson(response, 200, { vendors: await security.vendors.list(owner(context), { tenantId: query(context, 'tenantId'), state: query(context, 'state'), q: query(context, 'q') }) }));
  router.post('/api/security/vendors', async ({ request, response, context }) => sendJson(response, 201, await security.createVendor(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
  router.get('/api/security/data-inventory', async ({ response, context }) => sendJson(response, 200, { records: await security.dataInventory.list(owner(context), { tenantId: query(context, 'tenantId'), q: query(context, 'q') }) }));
  router.post('/api/security/data-inventory', async ({ request, response, context }) => sendJson(response, 201, await security.createDataRecord(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
  router.get('/api/security/legal-holds', async ({ response, context }) => sendJson(response, 200, { holds: await security.legalHolds.list(owner(context), { tenantId: query(context, 'tenantId'), active: query(context, 'active') || undefined, q: query(context, 'q') }) }));
  router.post('/api/security/legal-holds', async ({ request, response, context }) => sendJson(response, 201, await security.createLegalHold(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
  router.get('/api/security/subject-requests', async ({ response, context }) => sendJson(response, 200, { requests: await security.subjectRequests.list(owner(context), { tenantId: query(context, 'tenantId'), state: query(context, 'state'), q: query(context, 'q') }) }));
  router.post('/api/security/subject-requests', async ({ request, response, context }) => sendJson(response, 201, await security.createSubjectRequest(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
  router.get('/api/security/incidents', async ({ response, context }) => sendJson(response, 200, { incidents: await security.incidents.list(owner(context), { tenantId: query(context, 'tenantId'), state: query(context, 'state'), severity: query(context, 'severity'), q: query(context, 'q') }) }));
  router.post('/api/security/incidents', async ({ request, response, context }) => sendJson(response, 201, await security.createIncident(owner(context), await readJsonBody(request, { maximumBytes: 2000000 }))));
  router.get('/api/security/vulnerabilities', async ({ response, context }) => sendJson(response, 200, { vulnerabilities: await security.vulnerabilities.list(owner(context), { tenantId: query(context, 'tenantId'), state: query(context, 'state'), severity: query(context, 'severity'), q: query(context, 'q') }) }));
  router.post('/api/security/vulnerabilities', async ({ request, response, context }) => sendJson(response, 201, await security.createVulnerability(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
  router.get('/api/security/findings', async ({ response, context }) => sendJson(response, 200, { findings: await security.findings.list(owner(context), { tenantId: query(context, 'tenantId'), state: query(context, 'state'), severity: query(context, 'severity'), q: query(context, 'q') }) }));
  router.post('/api/security/findings', async ({ request, response, context }) => sendJson(response, 201, await security.createFinding(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
  router.post('/api/security/exceptions', async ({ request, response, context }) => sendJson(response, 201, await security.createException(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }))));
  router.post('/api/security/api-keys', async ({ request, response, context }) => sendJson(response, 201, await security.createApiKey(owner(context), await readJsonBody(request, { maximumBytes: 500000 }))));
  router.post('/api/security/secrets', async ({ request, response, context }) => sendJson(response, 201, await security.createSecret(owner(context), await readJsonBody(request, { maximumBytes: 500000 }))));
  router.get('/api/security/frameworks/:id/report', async ({ response, context, params }) => sendJson(response, 200, await security.report(owner(context), boundedString(params.id, 'frameworkId', { min: 2, max: 80 }))));
  router.get('/api/security/audit/verify', async ({ response, context }) => sendJson(response, 200, (await security.snapshot(owner(context))).auditVerification));
  router.post('/api/security/export', async ({ request, response, context }) => {
    const output = await security.export(owner(context), await readJsonBody(request, { maximumBytes: 1000000 }));
    response.statusCode = 200;
    response.setHeader('content-type', output.contentType);
    response.setHeader('content-disposition', `attachment; filename="merlin-security.${output.extension}"`);
    response.end(output.body);
  });
}
