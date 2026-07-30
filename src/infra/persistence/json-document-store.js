import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

function clone(value) { return structuredClone(value); }

export class JsonDocumentStore {
  #filePath;
  #defaultValue;
  #value;
  #queue = Promise.resolve();
  #loaded = false;

  constructor(options) {
    this.#filePath = options.filePath;
    this.#defaultValue = clone(options.defaultValue ?? {});
  }

  async load() {
    if (this.#loaded) return clone(this.#value);
    await mkdir(path.dirname(this.#filePath), { recursive: true });
    try {
      const text = await readFile(this.#filePath, 'utf8');
      this.#value = JSON.parse(text);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      this.#value = clone(this.#defaultValue);
      await this.#persist(this.#value);
    }
    this.#loaded = true;
    return clone(this.#value);
  }

  async read() { await this.load(); return clone(this.#value); }

  async update(mutator) {
    const operation = async () => {
      await this.load();
      const draft = clone(this.#value);
      const result = await mutator(draft);
      this.#value = draft;
      await this.#persist(draft);
      return clone(result === undefined ? draft : result);
    };
    this.#queue = this.#queue.then(operation, operation);
    return this.#queue;
  }

  async #persist(value) {
    const temporary = `${this.#filePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
    await rename(temporary, this.#filePath);
  }

  async close() { await this.#queue; }
}
