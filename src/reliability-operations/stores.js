import { OwnerOperationsStore } from './generic-store.js';
import { OPERATIONS_LIMITS } from './constants.js';
export class ServiceStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.services }); }
}
export class SloStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.slos }); }
}
export class MeasurementStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.measurements }); }
}
export class CheckStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.checks }); }
}
export class IncidentStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.incidents }); }
}
export class TimelineStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.incidents * 10 }); }
}
export class ReleaseStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.releases }); }
}
export class DeploymentStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.deployments }); }
}
export class QueueStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.queues }); }
}
export class JobStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.jobs }); }
}
export class BackupPolicyStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.backups }); }
}
export class BackupStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.backups }); }
}
export class RestoreTestStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.restoreTests }); }
}
export class MaintenanceStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.maintenance }); }
}
export class RiskStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.risks }); }
}
export class SyntheticStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.checks }); }
}
export class LogStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.logs }); }
}
export class MetricStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.measurements }); }
}
export class TraceStore extends OwnerOperationsStore {
    constructor() { super({ maximum: OPERATIONS_LIMITS.traces }); }
}
