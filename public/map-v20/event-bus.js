export class EventBus {
    constructor() { this.listeners = new Map(); }
    on(type, listener) { const listeners = this.listeners.get(type) || new Set(); listeners.add(listener); this.listeners.set(type, listeners); return () => this.off(type, listener); }
    once(type, listener) { const unsubscribe = this.on(type, value => { unsubscribe(); listener(value); }); return unsubscribe; }
    off(type, listener) { const listeners = this.listeners.get(type); if (!listeners)
        return; listeners.delete(listener); if (!listeners.size)
        this.listeners.delete(type); }
    emit(type, payload) { for (const listener of this.listeners.get(type) || []) {
        try {
            listener(payload);
        }
        catch (error) {
            console.error('map event listener failed', type, error);
        }
    } }
    clear() { this.listeners.clear(); }
}
