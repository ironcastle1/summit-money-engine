import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVersion, compareVersions, bumpVersion, versionPolicy, componentInventory, validateDependencies } from '../../src/release-engineering/index.js';
test('semantic versions parse compare and bump', () => { assert.equal(parseVersion('20.18.0').minor, 18); assert.equal(compareVersions('20.18.0', '20.17.9'), 1); assert.equal(bumpVersion('20.18.0', 'minor'), '20.19.0'); });
test('version policy rejects older candidate', () => assert.equal(versionPolicy({ current: '20.18.0', candidate: '20.17.0' }).valid, false));
test('component inventory validates dependency graph', () => { const items = [{ id: 'api', name: 'API', version: '1.0.0', dependencies: [] }, { id: 'web', name: 'Web', version: '1.0.0', dependencies: ['api'] }]; assert.equal(componentInventory(items).count, 2); assert.equal(validateDependencies(items).valid, true); });
test('missing component dependency is blocking', () => assert.equal(validateDependencies([{ id: 'web', name: 'Web', version: '1.0.0', dependencies: ['api'] }]).valid, false));
