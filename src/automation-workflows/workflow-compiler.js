import { referencedPaths } from './template-engine.js';
import { topologicalOrder } from './dependency-graph.js';
import { dependencyCycles } from './cycle-detector.js';
import { workflowRecord } from './workflow-schema.js';
import { fingerprint } from './ids.js';
export function compileWorkflow(input = {}) {
    const workflow = workflowRecord(input);
    const cycles = dependencyCycles(workflow.actions);
    if (cycles.length)
        throw new TypeError(`Workflow contains dependency cycles: ${cycles[0].join(' -> ')}`);
    const order = topologicalOrder(workflow.actions);
    const actionById = new Map(workflow.actions.map(action => [action.id, action]));
    const templatePaths = new Set();
    for (const action of workflow.actions)
        for (const path of referencedPaths(action.configuration))
            templatePaths.add(path);
    return Object.freeze({
        ...workflow,
        executionOrder: order,
        actionById,
        referencedContextPaths: Object.freeze([...templatePaths].sort()),
        checksum: fingerprint({ ...workflow, updatedAt: undefined }, 'wf-')
    });
}
