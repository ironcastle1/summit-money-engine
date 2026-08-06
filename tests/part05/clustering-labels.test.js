import test from 'node:test';
import assert from 'node:assert/strict';
import { clusterFeatures } from '../../src/geospatial/cluster.js';
import { expansionViewport } from '../../src/geospatial/cluster-expansion.js';
import { bilingualLabel, applyBilingualProperties } from '../../src/geospatial/label-language.js';
import { placeLabels } from '../../src/geospatial/label-collision.js';
const point = (id, lon, lat) => ({ type: 'Feature', id, geometry: { type: 'Point', coordinates: [lon, lat] }, properties: { name: id } });
test('nearby points cluster and can be expanded to a viewport', () => {
    const groups = clusterFeatures([point('a', 0, 51), point('b', 0.01, 51.01), point('c', 80, 10)], { zoom: 5, radiusPixels: 50 });
    const cluster = groups.find(group => group.type === 'cluster');
    assert.equal(cluster.count, 2);
    assert.ok(expansionViewport(cluster, { width: 900, height: 600 }).zoom > 5);
});
test('labels always place English first and local name second', () => {
    assert.deepEqual(bilingualLabel({ name: 'Damascus', nativeName: 'دمشق' }), { primary: 'Damascus', secondary: 'دمشق', text: 'Damascus\n(دمشق)' });
    const feature = applyBilingualProperties(point('damascus', 36.3, 33.5));
    assert.equal(feature.properties.labelEnglish, 'damascus');
});
test('label collision removes overlapping optional labels', () => {
    const result = placeLabels([{ id: 'a', box: { left: 0, top: 0, right: 50, bottom: 20 } }, { id: 'b', box: { left: 10, top: 5, right: 60, bottom: 25 } }]);
    assert.equal(result.accepted.length, 1);
    assert.equal(result.rejected.length, 1);
});
