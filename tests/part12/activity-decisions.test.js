import test from 'node:test';
import assert from 'node:assert/strict';
import { ActivityStore } from '../../src/decision-support/activity-store.js';
import { DecisionRegister } from '../../src/decision-support/decision-register.js';
test('notes tasks decisions and activity records are maintained', async () => {
  const activity = new ActivityStore();
  const decisions = new DecisionRegister();
  await activity.putNote('u1', { caseId: 'c1', title: 'Evidence', body: 'Check source.' });
  await activity.putTask('u1', { caseId: 'c1', title: 'Call carrier', priority: 80 });
  await decisions.put('u1', { caseId: 'c1', title: 'Reroute', rationale: 'Port risk' });
  assert.equal((await activity.listNotes('u1', 'c1')).length, 1);
  assert.equal((await activity.listTasks('u1', 'c1')).length, 1);
  assert.equal((await activity.listActivity('u1')).length, 2);
  assert.equal((await decisions.list('u1', 'c1')).length, 1);
});
