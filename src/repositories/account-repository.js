import { NotFoundError } from '../core/errors.js';
import { normalizeEmail } from '../domain/accounts/email.js';

export class AccountRepository {
  constructor(store) { this.store = store; }

  async list() { const document = await this.store.read(); return [...document.users]; }
  async findById(id) { return (await this.list()).find(user => user.id === id) || null; }
  async findByEmail(email) { const target = normalizeEmail(email); return (await this.list()).find(user => user.email === target) || null; }
  async create(user) {
    return this.store.update(document => {
      if (document.users.some(item => item.email === user.email)) return null;
      document.users.push(user);
      return user;
    });
  }
  async update(id, updater) {
    return this.store.update(async document => {
      const index = document.users.findIndex(user => user.id === id);
      if (index < 0) throw new NotFoundError('User not found', { id });
      const next = await updater({ ...document.users[index] });
      document.users[index] = { ...next, id, updatedAt: new Date().toISOString() };
      return document.users[index];
    });
  }
  async count() { return (await this.list()).length; }
}
