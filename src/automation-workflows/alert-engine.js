import { compileWorkflow } from './workflow-compiler.js';
import { evaluateTrigger } from './trigger-evaluator.js';
export class AlertRuleEngine {
    constructor(options = {}) { this.rules = options.rules; this.workflows = options.workflows; this.engine = options.engine; }
    async evaluate(owner, input = {}) { const rules = (await this.rules.list(owner)).filter(rule => rule.enabled); const matches = []; for (const rule of rules) {
        const result = evaluateTrigger(rule.trigger, input);
        if (!result.passed)
            continue;
        const workflow = rule.workflowId ? await this.workflows.get(owner, rule.workflowId) : compileWorkflow({ name: `Rule ${rule.name}`, owner, state: 'ACTIVE', triggers: [rule.trigger], actions: [{ type: 'SEND_NOTIFICATION', configuration: { title: rule.name, body: '{{signal.summary}}', severity: rule.severity, channels: rule.channels } }] });
        if (!workflow)
            continue;
        matches.push(Object.freeze({ rule, trigger: result, run: await this.engine.execute(workflow, { ...input, owner }) }));
    } return Object.freeze({ evaluated: rules.length, matched: matches.length, matches: Object.freeze(matches) }); }
}
