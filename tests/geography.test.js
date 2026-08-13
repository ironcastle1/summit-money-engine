import test from 'node:test';import assert from 'node:assert/strict';
import { locate, regionsFor, nearestStrategicNode } from '../src/intel/geography.js';

test('Taiwan title resolves to Taiwan rather than ambiguous Island aliases',()=>{const r={title:'Taiwan reports expanded military activity around the island',summary:'',regionHint:'strategic-asia'};const loc=locate(r);assert.equal(loc.name,'Taiwan');assert.ok(regionsFor(r,loc).includes('strategic-asia'))});
test('Hormuz text resolves directly to strategic chokepoint',()=>{const loc=locate({title:'Shipping warning issued for Strait of Hormuz',summary:''});assert.equal(loc.name,'Strait of Hormuz');assert.equal(loc.nodeId,'hormuz')});
test('Black Sea resolves as strategic security zone',()=>assert.equal(locate({title:'Black Sea port operations disrupted',summary:''}).name,'Black Sea'));
test('city title resolves before weaker summary aliases',()=>{const loc=locate({title:'Moscow announces new policy',summary:'Officials describe the issue as global.'});assert.equal(loc.name,'Moscow')});
test('country codes assign requested priority regions',()=>{const loc={name:'Iran',countryCode:'IR',lat:32,lon:53};assert.ok(regionsFor({title:'Policy change',summary:''},loc).includes('middle-east'))});
test('nearest strategic node detects geographic proximity',()=>{const n=nearestStrategicNode({lat:26.6,lon:56.2});assert.equal(n.id,'hormuz');assert.ok(n.distance<1)});
