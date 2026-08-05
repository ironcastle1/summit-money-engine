import test from 'node:test';
import assert from 'node:assert/strict';
import { parseClock, scheduleDefinition, scheduleDue } from '../../src/automation-workflows/index.js';
test('schedule parser validates clock', () => { assert.deepEqual(parseClock('07:30'), { hour: 7, minute: 30 }); assert.throws(() => parseClock('27:00')); });
test('interval schedule becomes due after interval', () => { const due = scheduleDue({ type: 'INTERVAL', intervalMinutes: 30 }, { now: '2026-08-04T12:31:00Z', lastRun: '2026-08-04T12:00:00Z' }); assert.equal(due, true); });
test('daily schedule respects time', () => { const schedule = scheduleDefinition({ type: 'DAILY', time: '09:00', timezone: 'UTC' }); assert.equal(scheduleDue(schedule, { now: '2026-08-04T08:59:00Z' }), false); assert.equal(scheduleDue(schedule, { now: '2026-08-04T09:01:00Z' }), true); });
