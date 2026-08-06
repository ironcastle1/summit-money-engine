export class MemoryOverlayStateRepository {
  constructor() { this.records = new Map(); }
  async get(subject) { const value = this.records.get(String(subject)); return value ? structuredClone(value) : null; }
  async put(subject, state) { this.records.set(String(subject), structuredClone(state)); return state; }
  async delete(subject) { return this.records.delete(String(subject)); }
}
export class UserDataOverlayStateRepository {
  constructor(userDataService) { this.userData = userDataService; }
  async get(subject) { if (!subject || subject === 'anonymous') return null; const data = await this.userData.get(subject, 'overlayState'); return data?.value || data || null; }
  async put(subject, state) { if (!subject || subject === 'anonymous') return state; await this.userData.put(subject, 'overlayState', state); return state; }
}
