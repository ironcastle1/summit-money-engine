const KEY = 'merlin.automation.v20';
export class AutomationState {
    constructor() { this.value = { tab: 'workflows', selectedWorkflowId: null, query: '', runState: '', notificationsUnread: false }; try {
        this.value = { ...this.value, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    }
    catch { } }
    get() { return Object.freeze({ ...this.value }); }
    set(patch) { this.value = { ...this.value, ...patch }; localStorage.setItem(KEY, JSON.stringify(this.value)); return this.get(); }
}
