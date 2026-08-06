import test from 'node:test';
import assert from 'node:assert/strict';
import {
  conflictEvents
}
from '../../src/conflict-intelligence/conflict-event-normalizer.js';
import {
  civilianExposure
}
from '../../src/conflict-intelligence/civilian-exposure.js';
import {
  infrastructureExposure
}
from '../../src/conflict-intelligence/infrastructure-exposure.js';
import {
  logisticsExposure
}
from '../../src/conflict-intelligence/logistics-exposure.js';
import {
  rawEvents
}
from './fixtures.js';
test('civilian and infrastructure targeting produce exposure scores',
() => {
  const events = conflictEvents(rawEvents);
  assert.ok(civilianExposure(events).score > 0);
  assert.ok(infrastructureExposure(events).score > 0);
  assert.ok(logisticsExposure(events).score >= 0);
});
