export class ProcessingBatch {
    constructor(options = {}) {
        this.id = options.id || `batch_${Date.now().toString(36)}`;
        this.maximum = options.maximum || 2000;
        this.createdAt = new Date().toISOString();
        this.items = [];
        this.errors = [];
        this.state = 'OPEN';
    }
    add(item) {
        this.#assertOpen();
        if (this.items.length >= this.maximum)
            throw new RangeError(`Batch maximum of ${this.maximum} exceeded`);
        this.items.push(item);
        return this.items.length;
    }
    addMany(items = []) {
        for (const item of items)
            this.add(item);
        return this.items.length;
    }
    reject(item, error) {
        this.errors.push({ itemId: item?.id || null, message: error?.message || String(error), code: error?.code || 'PROCESSING_ERROR' });
    }
    partition(size = 100) {
        const chunks = [];
        for (let index = 0; index < this.items.length; index += size)
            chunks.push(this.items.slice(index, index + size));
        return chunks;
    }
    close(result = {}) {
        this.#assertOpen();
        this.state = this.errors.length && !result.success ? 'PARTIAL' : 'COMPLETE';
        this.completedAt = new Date().toISOString();
        this.result = { ...result };
        return this.snapshot();
    }
    fail(error) {
        this.#assertOpen();
        this.state = 'FAILED';
        this.completedAt = new Date().toISOString();
        this.failure = { message: error?.message || String(error), code: error?.code || 'BATCH_FAILED' };
        return this.snapshot();
    }
    snapshot() {
        return {
            id: this.id,
            state: this.state,
            createdAt: this.createdAt,
            completedAt: this.completedAt || null,
            itemCount: this.items.length,
            errorCount: this.errors.length,
            errors: [...this.errors],
            result: this.result || null,
            failure: this.failure || null
        };
    }
    #assertOpen() {
        if (this.state !== 'OPEN')
            throw new Error(`Batch is ${this.state}`);
    }
}
