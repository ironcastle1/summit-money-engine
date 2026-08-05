import { RUN_STATES } from './constants.js';
import { ConcurrencyGate } from './concurrency-gate.js';
import { DedupeWindow } from './dedupe-window.js';
import { executionContext, stepContext } from './execution-context.js';
import { fingerprint } from './ids.js';
import { IdempotencyStore } from './idempotency-store.js';
import { quietHoursDecision } from './quiet-hours.js';
import { withRetries } from './retry-policy.js';
import { evaluateWorkflowTriggers } from './trigger-evaluator.js';
import { interpolateValue } from './template-engine.js';
function timeout(operation, milliseconds) { let timer; return Promise.race([Promise.resolve().then(operation), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Action timed out after ${milliseconds}ms`)), milliseconds); timer.unref?.(); })]).finally(() => clearTimeout(timer)); }
export class WorkflowEngine {
    constructor(options = {}) { Object.assign(this, options); this.dedupe = options.dedupe || new DedupeWindow(); this.idempotency = options.idempotency || new IdempotencyStore(); }
    async execute(workflow, input = {}) {
        const started = Date.now();
        const context = executionContext({ ...input, workflowId: workflow.id, owner: input.owner || workflow.owner });
        const run = { id: context.runId, workflowId: workflow.id, workflowVersion: workflow.version, owner: context.owner, state: 'QUEUED', trigger: null, steps: [], createdAt: new Date(started).toISOString(), context: { signalId: context.signal?.id, eventId: context.event?.id } };
        await this.runs.append(context.owner, run);
        const triggerResult = evaluateWorkflowTriggers(workflow, { ...context, ...input });
        if (!triggerResult.passed) {
            return this.runs.update(context.owner, run.id, { state: 'SUPPRESSED', trigger: triggerResult, reason: 'No workflow trigger matched', completedAt: new Date().toISOString(), durationMs: Date.now() - started });
        }
        const quiet = quietHoursDecision({ ...workflow.runPolicy.quietHours, severity: context.signal?.attention?.band }, input.now);
        if (quiet.quiet) {
            return this.runs.update(context.owner, run.id, { state: 'SUPPRESSED', trigger: triggerResult, reason: quiet.reason, completedAt: new Date().toISOString(), durationMs: Date.now() - started });
        }
        const dedupeKey = this.dedupe.key(workflow.id, input);
        if (this.dedupe.seen(dedupeKey, workflow.runPolicy.dedupeMinutes)) {
            return this.runs.update(context.owner, run.id, { state: 'SUPPRESSED', trigger: triggerResult, reason: 'Equivalent trigger already processed inside dedupe window', completedAt: new Date().toISOString(), durationMs: Date.now() - started });
        }
        this.dedupe.mark(dedupeKey);
        await this.runs.update(context.owner, run.id, { state: 'RUNNING', trigger: triggerResult, startedAt: new Date().toISOString(), dedupeKey });
        const outputs = {};
        const stepResults = [];
        let failed = false;
        const gate = new ConcurrencyGate(workflow.concurrency);
        for (const actionId of workflow.executionOrder) {
            const action = workflow.actionById.get(actionId);
            const blocked = (action.dependsOn || []).some(id => stepResults.find(item => item.id === id)?.state === 'FAILED');
            if (blocked) {
                stepResults.push(Object.freeze({ id: action.id, type: action.type, state: 'CANCELLED', reason: 'Dependency failed' }));
                continue;
            }
            const idempotencyKey = fingerprint({ workflow: workflow.checksum, run: run.id, action: action.id, signal: context.signal?.id }, 'action-');
            const existing = this.idempotency.get(idempotencyKey);
            if (existing) {
                outputs[action.id] = existing;
                stepResults.push(Object.freeze({ id: action.id, type: action.type, state: 'SUCCEEDED', idempotent: true, output: existing }));
                continue;
            }
            const stepStarted = Date.now();
            try {
                const prepared = Object.freeze({ ...action, configuration: interpolateValue(action.configuration, stepContext(context, outputs, action)) });
                const output = await gate.run(() => withRetries(() => timeout(() => this.actions.execute(prepared, stepContext(context, outputs, prepared)), prepared.timeoutMs), prepared.retry));
                this.idempotency.put(idempotencyKey, output);
                outputs[action.id] = output;
                stepResults.push(Object.freeze({ id: action.id, type: action.type, state: 'SUCCEEDED', durationMs: Date.now() - stepStarted, output }));
                this.metrics?.increment('automation_step_succeeded_total');
            }
            catch (error) {
                failed = true;
                stepResults.push(Object.freeze({ id: action.id, type: action.type, state: 'FAILED', durationMs: Date.now() - stepStarted, error: String(error.message || error) }));
                this.metrics?.increment('automation_step_failed_total');
                if (!action.continueOnError)
                    break;
            }
        }
        const succeeded = stepResults.filter(item => item.state === 'SUCCEEDED').length;
        const state = failed ? (succeeded ? 'PARTIAL' : 'FAILED') : 'SUCCEEDED';
        if (!RUN_STATES.includes(state))
            throw new Error('Invalid run state');
        const completed = await this.runs.update(context.owner, run.id, { state, steps: Object.freeze(stepResults), outputs: Object.freeze(outputs), completedAt: new Date().toISOString(), durationMs: Date.now() - started });
        this.metrics?.increment(`automation_run_${state.toLowerCase()}_total`);
        this.metrics?.observe('automation_run_duration_ms', completed.durationMs);
        await this.audit?.append(context.owner, { action: 'EXECUTED', resourceType: 'WORKFLOW', resourceId: workflow.id, metadata: { runId: run.id, state, steps: stepResults.length } });
        return completed;
    }
}
