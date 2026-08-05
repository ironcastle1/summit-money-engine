import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDecisionSnapshot } from '../../src/decision-support/snapshot-builder.js';
import { composeReport } from '../../src/decision-support/report-composer.js';
import { DecisionSupportExportService } from '../../src/decision-support/export-service.js';
import { fixtureSignals } from './fixtures.js';
test('reports export to json csv markdown and html', () => {
  const snapshot = buildDecisionSnapshot({ signals: fixtureSignals() });
  const report = composeReport(snapshot, { type: 'MORNING' });
  const exporter = new DecisionSupportExportService();
  assert.match(exporter.toJson(report), /MORNING/);
  assert.match(exporter.signalsCsv(snapshot.signals), /domain,priority/);
  assert.match(exporter.reportMarkdown(report), /# MORNING/);
  assert.match(exporter.reportHtml(report), /<!doctype html>/);
});
