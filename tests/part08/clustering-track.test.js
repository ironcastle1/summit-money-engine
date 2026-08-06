import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clusterHazards
}
from '../../src/hazards/event-cluster.js';
import {
  buildHazardTrack
}
from '../../src/hazards/track-model.js';
const events=[ {
  id:'a', type:'TROPICAL_CYCLONE', point: {
    lat:10, lon:10
  }, time:'2026-08-04T00:00:00Z', materiality: {
    score:70
  }
}, {
  id:'b', type:'TROPICAL_CYCLONE', point: {
    lat:10.5, lon:10.5
  }, time:'2026-08-04T06:00:00Z', materiality: {
    score:80
  }
}];
test('clusters nearby hazards', ()=> {
  const clusters=clusterHazards(events);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].count, 2);
});
test('builds motion track', ()=> {
  const track=buildHazardTrack(events);
  assert.equal(track.segments.length, 1);
  assert.ok(track.motion.speedKph>0);
});
