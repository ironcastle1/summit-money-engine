import { canonicalName } from './text-normalizer.js';
export class AliasIndex {
    constructor() { this.byAlias = new Map(); this.byEntity = new Map(); }
    add(entity) {
        if (!entity?.id)
            return;
        const keys = new Set([entity.name, entity.canonicalName, ...(entity.aliases || [])].map(canonicalName).filter(Boolean));
        this.remove(entity.id);
        this.byEntity.set(entity.id, keys);
        for (const key of keys) {
            if (!this.byAlias.has(key))
                this.byAlias.set(key, new Set());
            this.byAlias.get(key).add(entity.id);
        }
    }
    remove(entityId) {
        for (const key of this.byEntity.get(entityId) || []) {
            const values = this.byAlias.get(key);
            values?.delete(entityId);
            if (!values?.size)
                this.byAlias.delete(key);
        }
        this.byEntity.delete(entityId);
    }
    lookup(value) { return [...(this.byAlias.get(canonicalName(value)) || [])]; }
    candidates(value) {
        const key = canonicalName(value);
        const results = new Set(this.lookup(key));
        if (!results.size && key.length >= 4)
            for (const [alias, ids] of this.byAlias)
                if (alias.includes(key) || key.includes(alias))
                    for (const id of ids)
                        results.add(id);
        return [...results];
    }
    snapshot() { return { aliases: this.byAlias.size, entities: this.byEntity.size }; }
}
