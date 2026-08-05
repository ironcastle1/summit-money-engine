import test from 'node:test';
import assert from 'node:assert/strict';
import { SavedMapViewService } from '../../src/services/saved-map-view-service.js';
function memoryUserData() { let values = []; return { async get() { return structuredClone(values); }, async put(_user, bucket, next) { assert.equal(bucket, 'savedViews'); values = structuredClone(next); return structuredClone(values); } }; }
test('saved map views can be inserted, updated and removed', async () => {
    const service = new SavedMapViewService({ userData: memoryUserData(), maximum: 5 });
    const user = { id: 'user-1' };
    let values = await service.put(user, { id: 'world', name: 'World', state: { center: { lat: 0, lon: 0 }, zoom: 2 } });
    assert.equal(values.length, 1);
    values = await service.put(user, { id: 'world', name: 'World updated', state: { center: { lat: 20, lon: 10 }, zoom: 4 } });
    assert.equal(values.length, 1);
    assert.equal(values[0].name, 'World updated');
    const removed = await service.remove(user, 'world');
    assert.equal(removed.removed, true);
    assert.equal(removed.views.length, 0);
});
