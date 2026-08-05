import { frozen } from './utilities.js';
export const DEFAULT_SERVICES = frozen([
    { id: 'web', name: 'Merlin Web Application', tier: 1, type: 'WEB', ownerTeam: 'PLATFORM', dependencies: ['api'] },
    { id: 'api', name: 'Merlin API', tier: 1, type: 'API', ownerTeam: 'PLATFORM', dependencies: ['persistence', 'connectors'] },
    { id: 'ingestion', name: 'Intelligence Ingestion', tier: 1, type: 'WORKER', ownerTeam: 'INTELLIGENCE', dependencies: ['connectors', 'persistence'] },
    { id: 'map', name: 'Geospatial Rendering', tier: 1, type: 'CLIENT', ownerTeam: 'GEOSPATIAL', dependencies: ['api', 'tile-providers'] },
    { id: 'automation', name: 'Automation Orchestrator', tier: 2, type: 'WORKER', ownerTeam: 'OPERATIONS', dependencies: ['api', 'notifications'] },
    { id: 'publishing', name: 'Publishing and Delivery', tier: 2, type: 'WORKER', ownerTeam: 'CUSTOMER_OPERATIONS', dependencies: ['api', 'notifications'] },
    { id: 'persistence', name: 'Operational Persistence', tier: 1, type: 'DATA', ownerTeam: 'PLATFORM', dependencies: [] },
    { id: 'connectors', name: 'External Data Connectors', tier: 2, type: 'INTEGRATION', ownerTeam: 'INTELLIGENCE', dependencies: [] }
]);
export function serviceTemplate(id) { return DEFAULT_SERVICES.find(item => item.id === String(id)) || null; }
