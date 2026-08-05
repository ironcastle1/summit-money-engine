import { ComponentStore, ContractStore, MigrationStore, ArtifactStore, EvidenceStore, CandidateStore, ReleaseNoteStore, releaseEngineeringCatalog, DEFAULT_COMPONENTS, componentRecord, componentInventory, validateDependencies, environmentContract, configurationMatrix, connectorReadiness, sourceReadiness, migrationRecord, migrationPlan, migrationRun, apiContract, endpointInventory, contractDiff, artifactRecord, artifactManifest, checksumManifest, buildProvenance, softwareBillOfMaterials, licenseReport, thirdPartyAttribution, performanceBudget, testEvidence, releaseCandidate, versionPolicy, releaseReadiness, deploymentChecklist, upgradePlan, rollbackPlan, releaseNotes, changelog, supportMatrix, goLiveReport, finalAcceptance, releaseDiagnostics, releaseJson, releaseCsv, releaseSummary } from '../release-engineering/index.js';
export class ReleaseEngineeringService {
    constructor(dependencies = {}) { this.dependencies = dependencies; this.components = new ComponentStore(); this.contracts = new ContractStore(); this.migrations = new MigrationStore(); this.artifacts = new ArtifactStore(); this.evidence = new EvidenceStore(); this.candidates = new CandidateStore(); this.notes = new ReleaseNoteStore(); }
    catalog() { return releaseEngineeringCatalog(); }
    async seed(owner = 'anonymous') { if (!(await this.components.list(owner)).length)
        for (const item of DEFAULT_COMPONENTS)
            await this.components.put(owner, componentRecord(item)); if (!(await this.candidates.list(owner)).length)
        await this.candidates.put(owner, releaseCandidate({ version: '20.18.0', title: 'Merlin V20 market-ready release', state: 'ASSESSING', componentIds: DEFAULT_COMPONENTS.map(item => item.id) })); return this.snapshot(owner); }
    async addComponent(owner, input) { const record = componentRecord(input); await this.components.put(owner, record); return record; }
    async addContract(owner, input) { const record = apiContract(input); await this.contracts.put(owner, record); return record; }
    async addMigration(owner, input) { const record = migrationRecord(input); await this.migrations.put(owner, record); return record; }
    async addArtifact(owner, input) { const record = artifactRecord(input); await this.artifacts.put(owner, record); return record; }
    async addEvidence(owner, input) { const record = testEvidence(input); await this.evidence.put(owner, record); return record; }
    async addCandidate(owner, input) { const record = releaseCandidate(input); await this.candidates.put(owner, record); return record; }
    async addNotes(owner, input) { const record = releaseNotes(input); await this.notes.put(owner, record); return record; }
    version(input) { return versionPolicy(input); }
    environment(input) { const rows = (input.environments || []).map(environmentContract); return { environments: rows, matrix: configurationMatrix(rows), ready: rows.every(item => item.ready) }; }
    connectors(input) { return connectorReadiness(input.connectors || []); }
    sources(input) { return sourceReadiness(input.groups || {}); }
    migrationsPlan(input) { return migrationPlan(input.migrations || [], input.appliedIds || []); }
    migrationExecution(input) { const plan = this.migrationsPlan(input); return { plan, run: migrationRun({ ...input, plan }) }; }
    contractsDiff(input) { return contractDiff(input.previous || [], input.next || []); }
    budgets(input) { return performanceBudget(input); }
    checklist(input) { return deploymentChecklist(input); }
    upgrade(input) { return upgradePlan(input); }
    rollback(input) { return rollbackPlan(input); }
    acceptance(input) { return finalAcceptance(input); }
    async runtimeEvidence() { const build = await this.dependencies.buildInfo?.snapshot?.().catch?.(() => null) || null; const health = this.dependencies.health?.snapshot?.() || null; const operations = await this.dependencies.reliabilityOperations?.diagnostics?.('anonymous').catch?.(() => null) || null; const security = await this.dependencies.securityCompliance?.diagnostics?.('anonymous').catch?.(() => null) || null; return { build, health, operations, security, startup: this.dependencies.startupDiagnostics || null }; }
    async snapshot(owner = 'anonymous') {
        const [components, contracts, migrations, artifacts, evidence, candidates, notes, runtime] = await Promise.all([this.components.list(owner), this.contracts.list(owner), this.migrations.list(owner), this.artifacts.list(owner), this.evidence.list(owner), this.candidates.list(owner), this.notes.list(owner), this.runtimeEvidence()]);
        const inventory = componentInventory(components), dependencies = validateDependencies(components), migrationAssessment = migrationPlan(migrations, []), contractInventory = endpointInventory(contracts), manifest = artifactManifest(artifacts, { version: candidates[0]?.version || '20.18.0', candidateId: candidates[0]?.id }), checksums = checksumManifest(artifacts), tests = evidence;
        const readiness = releaseReadiness({ versionPolicy: versionPolicy({ current: '20.17.0', candidate: candidates[0]?.version || '20.18.0' }), dependencies, environment: { ready: true, missing: [] }, migrations: migrationAssessment, contracts: { state: 'COMPATIBLE', breaking: false }, performance: { pass: true, failures: [] }, tests, security: runtime.security ? { pass: true } : null, operations: runtime.operations ? { pass: true } : null, artifacts: manifest });
        const checklist = deploymentChecklist({ approved: candidates[0]?.state === 'APPROVED', backupVerified: Boolean(runtime.operations?.report?.failedRestores === 0), migrationsReady: migrationAssessment.valid, rollbackReady: Boolean(runtime.operations?.report), observabilityReady: Boolean(runtime.operations), supportBriefed: false, statusPrepared: false, owner: candidates[0]?.createdBy });
        const rollback = rollbackPlan({ candidateId: candidates[0]?.id, previousArtifactId: artifacts.find(item => item.type === 'SERVER')?.id || 'previous-server-artifact', backupId: runtime.operations?.report?.failedRestores === 0 ? 'verified-backup' : null, reversibleMigrations: migrationAssessment.reversible });
        const goLive = goLiveReport({ candidate: candidates[0], readiness, checklist, migrations: migrationAssessment, rollback, operations: runtime.operations, security: runtime.security, knownIssues: [] });
        const snapshot = { components, inventory, dependencies, contracts, contractInventory, migrations, migrationAssessment, artifacts, manifest, checksums, evidence, candidates, notes, runtime, readiness, checklist, rollback, goLive, generatedAt: new Date().toISOString() };
        return Object.freeze({ ...snapshot, diagnostics: releaseDiagnostics(snapshot) });
    }
    async diagnostics(owner) { const snapshot = await this.snapshot(owner); return Object.freeze({ ...snapshot.diagnostics, readiness: snapshot.readiness, goLive: snapshot.goLive, runtime: snapshot.runtime }); }
    async packageReport(owner, input = {}) { const snapshot = await this.snapshot(owner); const sbom = softwareBillOfMaterials({ product: { name: 'Merlin', version: snapshot.candidates[0]?.version || '20.18.0' }, components: input.dependencies || [] }); const licenses = licenseReport(sbom.components, input.licensePolicy || {}); const provenance = buildProvenance(input.provenance || {}); return Object.freeze({ manifest: snapshot.manifest, checksums: snapshot.checksums, sbom, licenses, attribution: thirdPartyAttribution(sbom.components), provenance, support: supportMatrix(input.support || {}) }); }
    async export(owner, input = {}) { const snapshot = await this.snapshot(owner); const format = String(input.format || 'JSON').toUpperCase(); if (format === 'CSV')
        return { contentType: 'text/csv; charset=utf-8', extension: 'csv', body: releaseCsv(input.resource === 'COMPONENTS' ? snapshot.components : input.resource === 'MIGRATIONS' ? snapshot.migrations : snapshot.evidence) }; if (format === 'SUMMARY')
        return { contentType: 'text/plain; charset=utf-8', extension: 'txt', body: releaseSummary(snapshot) }; if (format === 'CHANGELOG')
        return { contentType: 'text/markdown; charset=utf-8', extension: 'md', body: changelog(snapshot.notes) }; return { contentType: 'application/json; charset=utf-8', extension: 'json', body: releaseJson(snapshot) }; }
}
export function createReleaseEngineeringService(dependencies = {}) { return new ReleaseEngineeringService(dependencies); }
