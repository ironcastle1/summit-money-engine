import { ReleaseStore } from './generic-store.js';
import { RELEASE_LIMITS } from './constants.js';
export class ComponentStore extends ReleaseStore {
    constructor() { super({ maximum: RELEASE_LIMITS.components }); }
}
export class ContractStore extends ReleaseStore {
    constructor() { super({ maximum: RELEASE_LIMITS.contracts }); }
}
export class MigrationStore extends ReleaseStore {
    constructor() { super({ maximum: RELEASE_LIMITS.migrations }); }
}
export class ArtifactStore extends ReleaseStore {
    constructor() { super({ maximum: RELEASE_LIMITS.artifacts }); }
}
export class EvidenceStore extends ReleaseStore {
    constructor() { super({ maximum: RELEASE_LIMITS.evidence }); }
}
export class CandidateStore extends ReleaseStore {
    constructor() { super({ maximum: RELEASE_LIMITS.candidates }); }
}
export class ReleaseNoteStore extends ReleaseStore {
    constructor() { super({ maximum: RELEASE_LIMITS.notes }); }
}
