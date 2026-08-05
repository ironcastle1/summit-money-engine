export class ActionRegistry {
    constructor() { this.handlers = new Map(); }
    register(type, handler) { const key = String(type).toUpperCase(); if (this.handlers.has(key))
        throw new TypeError(`Action handler already registered: ${key}`); if (typeof handler !== 'function')
        throw new TypeError('Action handler must be a function'); this.handlers.set(key, handler); return this; }
    get(type) { return this.handlers.get(String(type).toUpperCase()) || null; }
    list() { return Object.freeze([...this.handlers.keys()].sort()); }
    async execute(action, context) { const handler = this.get(action.type); if (!handler)
        throw new TypeError(`No action handler registered for ${action.type}`); return handler(action, context); }
}
