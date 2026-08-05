import test from 'node:test';
import assert from 'node:assert/strict';
import { planCampaign, publicationSchedule, scheduleDue } from '../../src/publishing/index.js';

test('daily schedule is due after configured publication hour', () => { assert.equal(scheduleDue({ cadence: 'DAILY', hour: 7, minute: 0 }, '2026-08-03T07:00:00Z', new Date('2026-08-04T08:00:00Z')), true); });
test('daily schedule is not due twice in one day', () => { assert.equal(scheduleDue({ cadence: 'DAILY', hour: 7 }, '2026-08-04T07:10:00Z', new Date('2026-08-04T09:00:00Z')), false); });
test('campaign planner creates deterministic recipient batches', () => { const recipients = Array.from({ length: 525 }, (_, index) => ({ id: `r${index}` })); const plan = planCampaign({ editionId: 'e1', recipients, batchSize: 250, startAt: '2026-08-04T08:00:00Z' }); assert.equal(plan.batches.length, 3); assert.equal(plan.batches[2].recipients.length, 25); });
test('publication schedule bounds operational values', () => { const schedule = publicationSchedule({ cadence: 'WEEKLY', hour: 50, minute: 90, weekday: 9 }); assert.equal(schedule.hour, 23); assert.equal(schedule.minute, 59); assert.equal(schedule.weekday, 6); });
