import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPublicationPreview, composeEditionContent, editionBlocksCsv, editionHtml, editionMarkdown, editionRecord, publicationQualityGate } from '../../src/publishing/index.js';
import { editionFixture } from './fixtures.js';

test('decision snapshots become publication blocks', () => { const blocks = composeEditionContent({ snapshot: { executiveSummary: { text: 'Summary' }, signals: [{ id: 's1', title: 'Signal' }], recommendations: [{ title: 'Act' }] } }); assert.ok(blocks.some(item => item.type === 'EXECUTIVE_SUMMARY')); assert.ok(blocks.some(item => item.type === 'KEY_FINDINGS')); });
test('quality gate identifies approvals and sources', () => { const edition = editionRecord(editionFixture()); const gate = publicationQualityGate(edition, { approvalRequired: true }); assert.equal(gate.passed, false); assert.ok(gate.failures.includes('APPROVAL_REQUIRED')); });
test('quality gate passes approved sourced edition', () => { const edition = editionRecord({ ...editionFixture(), approval: { history: [{ state: 'APPROVED' }] } }); const gate = publicationQualityGate(edition, { approvalRequired: true }); assert.equal(gate.passed, true); });
test('HTML, Markdown and CSV renderers expose edition content', () => { const edition = editionRecord(editionFixture()); assert.match(editionHtml(edition), /Morning Intelligence/); assert.match(editionMarkdown(edition), /# Morning Intelligence/); assert.match(editionBlocksCsv(edition), /EXECUTIVE_SUMMARY/); });
test('preview combines layout, quality and rendered formats', () => { const preview = buildPublicationPreview(editionRecord(editionFixture()), { approvalRequired: false }); assert.equal(preview.layout.pageSize, 'A4'); assert.match(preview.html, /<!doctype html>/); });
