import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildConflictSnapshot
}
from '../../src/conflict-intelligence/snapshot-builder.js';
import {
  ConflictExportService
}
from '../../src/conflict-intelligence/export-service.js';
import {
  rawEvents
}
from './fixtures.js';
test('map features and exports contain theatre data',
() => {
  const snapshot = buildConflictSnapshot(rawEvents),
  exporter = new ConflictExportService();
  assert.ok(snapshot.features.features.some(feature => feature.properties.kind === 'CONFLICT_THEATRE'));
  assert.match(exporter.toCsv(snapshot.theatres),
  /example-war/);
  assert.equal(exporter.summary(snapshot).theatres,
  2);
});
