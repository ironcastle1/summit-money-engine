import test from 'node:test';
import assert from 'node:assert/strict';
import { contentBlockRecord, editionRecord, publicationRecord, publicationTemplateRecord, subscriberRecord } from '../../src/publishing/index.js';
import { editionFixture, publicationFixture, subscriberFixture } from './fixtures.js';

test('publication schema preserves classification and cadence', () => { const item = publicationRecord(publicationFixture()); assert.equal(item.state, 'ACTIVE'); assert.equal(item.classification, 'CLIENT'); assert.equal(item.cadence, 'DAILY'); });
test('edition schema normalizes blocks and source ids', () => { const item = editionRecord(editionFixture()); assert.equal(item.blocks.length, 2); assert.equal(item.blocks[0].type, 'EXECUTIVE_SUMMARY'); assert.deepEqual(item.sourceIds, ['source-1']); });
test('unsupported content block type is rejected', () => assert.throws(() => contentBlockRecord({ type: 'UNKNOWN' }), /Unsupported content block/));
test('template schema exposes required publication blocks', () => { const item = publicationTemplateRecord({ name: 'Test', requiredBlockTypes: ['EXECUTIVE_SUMMARY'] }); assert.deepEqual(item.requiredBlockTypes, ['EXECUTIVE_SUMMARY']); });
test('subscriber schema normalizes delivery preferences', () => { const item = subscriberRecord(subscriberFixture()); assert.equal(item.email, 'reader@example.test'); assert.deepEqual(item.channels, ['IN_APP', 'SECURE_LINK']); });
