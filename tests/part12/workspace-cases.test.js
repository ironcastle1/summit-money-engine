import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkspaceStore } from '../../src/decision-support/workspace-store.js';
import { CaseFileStore } from '../../src/decision-support/case-file-store.js';
test('workspace and case stores isolate owners and preserve records', async () => {
  const workspaces = new WorkspaceStore();
  const cases = new CaseFileStore();
  const workspace = await workspaces.put('u1', { name: 'Morning' });
  const caseFile = await cases.put('u1', { title: 'Port disruption', priority: 75 });
  assert.equal((await workspaces.list('u1')).length, 1);
  assert.equal((await workspaces.list('u2')).length, 0);
  assert.equal((await cases.get('u1', caseFile.id)).priority, 75);
  assert.ok(await workspaces.remove('u1', workspace.id));
});
