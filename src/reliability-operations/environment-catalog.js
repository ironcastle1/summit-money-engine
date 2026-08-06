import { frozen } from './utilities.js';
export const ENVIRONMENTS = frozen([
    { id: 'development', production: false, approvalRequired: false, minimumReplicas: 1 },
    { id: 'test', production: false, approvalRequired: false, minimumReplicas: 1 },
    { id: 'staging', production: false, approvalRequired: true, minimumReplicas: 1 },
    { id: 'production', production: true, approvalRequired: true, minimumReplicas: 2 }
]);
export function environmentById(id) { return ENVIRONMENTS.find(item => item.id === String(id).toLowerCase()) || null; }
