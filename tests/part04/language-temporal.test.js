import test from 'node:test';
import assert from 'node:assert/strict';
import { detectScript, detectLanguage, bilingualLabel, languageAgreement } from '../../src/intelligence-processing/language-tools.js';
import { normalizeTimestamp, timeWindow, temporalOverlap, bucketTimestamp } from '../../src/intelligence-processing/temporal-normalizer.js';
test('language tools detect scripts and preserve English-first bilingual labels', () => {
    assert.equal(detectScript('دمشق'), 'ARABIC');
    assert.equal(detectLanguage('Москва сообщает о событии').language, 'ru');
    assert.deepEqual(bilingualLabel({ name: 'Damascus', localName: 'دمشق' }), { english: 'Damascus', local: 'دمشق', display: 'Damascus\n(دمشق)' });
});
test('language agreement reports primary language and diversity', () => {
    const result = languageAgreement([{ title: 'The port is closed' }, { title: 'Officials confirm the closure' }, { title: 'Le port est fermé' }]);
    assert.equal(result.primary, 'en');
    assert.ok(result.diversity >= 2);
    assert.ok(result.agreement > 0.5);
});
test('temporal normalizer resolves relative and numeric timestamps', () => {
    const now = Date.parse('2026-08-04T12:00:00Z');
    assert.equal(normalizeTimestamp('2 hours ago', { now }), '2026-08-04T10:00:00.000Z');
    assert.equal(normalizeTimestamp(1775304000), '2026-04-04T12:00:00.000Z');
    assert.equal(bucketTimestamp('2026-08-04T10:37:00Z'), '2026-08-04T10:00:00.000Z');
});
test('time windows and overlap quantify report timing', () => {
    const window = timeWindow([{ timestamp: '2026-08-04T10:00:00Z' }, { timestamp: '2026-08-04T13:00:00Z' }]);
    assert.equal(window.spanHours, 3);
    const overlap = temporalOverlap({ start: '2026-08-04T10:00:00Z', end: '2026-08-04T14:00:00Z' }, { start: '2026-08-04T12:00:00Z', end: '2026-08-04T16:00:00Z' });
    assert.ok(overlap > 0.3 && overlap < 0.4);
});
