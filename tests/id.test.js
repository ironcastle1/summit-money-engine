import test from 'node:test';
import assert from 'node:assert/strict';
import { id, sha256 } from '../src/util/id.js';

test('IDs use requested prefix and are unique', () => {
  const a = id('PROD');
  const b = id('PROD');
  assert.match(a, /^PROD-/);
  assert.notEqual(a,b);
});

test('sha256 is stable', () => {
  assert.equal(sha256(Buffer.from('MERLIN')), sha256(Buffer.from('MERLIN')));
  assert.notEqual(sha256(Buffer.from('MERLIN')), sha256(Buffer.from('Merlin')));
});
