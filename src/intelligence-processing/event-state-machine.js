import { STATUS_TRANSITIONS } from './constants.js';
export class EventStateMachine {
    constructor(initial = 'REPORTED') {
        this.state = normalizeState(initial);
        this.history = [{ state: this.state, timestamp: new Date().toISOString(), reason: 'initial' }];
    }
    canTransition(next) {
        const target = normalizeState(next);
        return (STATUS_TRANSITIONS[this.state] || []).includes(target);
    }
    transition(next, context = {}) {
        const target = normalizeState(next);
        if (target === this.state)
            return this.snapshot();
        if (!this.canTransition(target)) {
            const error = new Error(`Invalid event transition: ${this.state} -> ${target}`);
            error.code = 'INVALID_EVENT_TRANSITION';
            throw error;
        }
        this.state = target;
        this.history.push({
            state: target,
            timestamp: context.timestamp || new Date().toISOString(),
            reason: context.reason || null,
            actor: context.actor || 'system',
            evidenceIds: [...(context.evidenceIds || [])]
        });
        return this.snapshot();
    }
    infer(input = {}) {
        if (input.retracted)
            return this.#try('RETRACTED', 'source retraction');
        if (input.resolved)
            return this.#try('RESOLVED', 'resolution evidence');
        if (input.disputed && this.state !== 'DISPUTED')
            return this.#try('DISPUTED', 'material contradiction');
        if (input.escalating && this.state === 'ONGOING')
            return this.#try('ESCALATING', 'impact increasing');
        if (input.confirmed && ['RUMOURED', 'REPORTED', 'DISPUTED'].includes(this.state))
            return this.#try('CONFIRMED', 'independent confirmation');
        if (input.ongoing && this.state === 'CONFIRMED')
            return this.#try('ONGOING', 'continued observations');
        return this.snapshot();
    }
    snapshot() {
        return { state: this.state, history: [...this.history], transitions: STATUS_TRANSITIONS[this.state] || [] };
    }
    #try(target, reason) {
        return this.canTransition(target) ? this.transition(target, { reason }) : this.snapshot();
    }
}
function normalizeState(value) {
    const state = String(value || 'REPORTED').toUpperCase();
    return STATUS_TRANSITIONS[state] ? state : 'REPORTED';
}
