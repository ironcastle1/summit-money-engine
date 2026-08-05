import { deepFreeze } from './utilities.js';
export const DEFAULT_COMPONENTS = deepFreeze([
    { id: 'web', name: 'Merlin Web Application', type: 'CLIENT', version: '20.18.0', ownerTeam: 'PLATFORM', criticality: 'HIGH', dependencies: ['api'], entrypoints: ['public/merlin.js'] },
    { id: 'api', name: 'Merlin API', type: 'SERVER', version: '20.18.0', ownerTeam: 'PLATFORM', criticality: 'CRITICAL', dependencies: ['persistence'], entrypoints: ['server.js'] },
    { id: 'persistence', name: 'Operational Persistence', type: 'DATA', version: '20.18.0', ownerTeam: 'PLATFORM', criticality: 'CRITICAL', dependencies: [], entrypoints: ['runtime-data'] },
    { id: 'ingestion', name: 'Intelligence Ingestion', type: 'WORKER', version: '20.18.0', ownerTeam: 'INTELLIGENCE', criticality: 'HIGH', dependencies: ['api', 'persistence'], entrypoints: ['src/ingestion'] },
    { id: 'map', name: 'Geospatial Runtime', type: 'CLIENT', version: '20.18.0', ownerTeam: 'GEOSPATIAL', criticality: 'HIGH', dependencies: ['api'], entrypoints: ['public/map'] },
    { id: 'automation', name: 'Workflow Orchestrator', type: 'WORKER', version: '20.18.0', ownerTeam: 'OPERATIONS', criticality: 'MEDIUM', dependencies: ['api'], entrypoints: ['src/automation-workflows'] }
]);
export const DEFAULT_ACCEPTANCE = deepFreeze([
    { id: 'tests', title: 'All automated tests pass', required: true },
    { id: 'syntax', title: 'All JavaScript parses', required: true },
    { id: 'security', title: 'Secret scan passes', required: true },
    { id: 'files', title: 'Every upload part has fewer than 100 files', required: true },
    { id: 'lines', title: 'Source code exceeds 50,000 lines', required: true },
    { id: 'map', title: 'Map and overlays load', required: true },
    { id: 'earthquakes', title: 'Only material earthquakes are surfaced', required: true },
    { id: 'shipping', title: 'Shipping remains map-only', required: true }
]);
export function releaseEngineeringCatalog() {
    return deepFreeze({
        platform: 'MERLIN_RELEASE_ENGINEERING',
        version: '20.18.0',
        parts: 18,
        artifactTypes: ['SOURCE', 'CLIENT', 'SERVER', 'DATA', 'MIGRATION', 'DOCUMENTATION', 'CONTAINER', 'MANIFEST'],
        gateStates: ['PASS', 'WARN', 'FAIL', 'NOT_RUN', 'NOT_APPLICABLE'],
        components: DEFAULT_COMPONENTS,
        acceptanceCriteria: DEFAULT_ACCEPTANCE
    });
}
