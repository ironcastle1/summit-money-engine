import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOnboardingPlan, ONBOARDING_STEPS } from '../../src/market-readiness/onboarding-plan.js';
import { createDemoWorkspace, isDemoRequest } from '../../src/market-readiness/demo-workspace.js';

test('onboarding plan tracks customer progress', () => {
  const partial = buildOnboardingPlan({ completed: ['welcome', 'search'] });
  assert.equal(partial.version, '20.20.0');
  assert.equal(partial.completed, false);
  assert.equal(partial.steps.filter(step => step.completed).length, 2);
  assert.ok(partial.progress > 0 && partial.progress < 100);
});

test('onboarding completes only when every step is recorded', () => {
  const complete = buildOnboardingPlan({ completed: ONBOARDING_STEPS.map(step => step.id) });
  assert.equal(complete.completed, true);
  assert.equal(complete.progress, 100);
});

test('demo workspace is prominently labelled and operationally safe', () => {
  const demo = createDemoWorkspace({ now: '2026-08-05T12:00:00.000Z' });
  assert.match(demo.notice, /DEMONSTRATION DATA/);
  assert.equal(demo.sample, true);
  assert.equal(demo.safeguards.canSendNotifications, false);
  assert.equal(demo.safeguards.canCreateBillingActions, false);
  assert.equal(demo.safeguards.canRepresentLiveData, false);
});

test('demo query parsing accepts explicit affirmative values only', () => {
  assert.equal(isDemoRequest(new URLSearchParams('demo=true')), true);
  assert.equal(isDemoRequest(new URLSearchParams('demo=1')), true);
  assert.equal(isDemoRequest(new URLSearchParams('demo=no')), false);
});
