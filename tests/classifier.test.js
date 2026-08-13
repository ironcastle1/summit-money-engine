import test from 'node:test';import assert from 'node:assert/strict';import { classify } from '../src/intel/classifier.js';

test('missile attack classifies as conflict',()=>assert.equal(classify({title:'Missile attack hits military facility'}).primary,'conflict'));
test('OFAC designations classify as sanctions',()=>assert.equal(classify({title:'OFAC announces new sanctions designations'}).primary,'sanctions'));
test('Hormuz tanker disruption classifies as shipping',()=>assert.equal(classify({title:'Tanker traffic disrupted in Strait of Hormuz'}).primary,'shipping'));
test('central bank rate decision classifies as macro',()=>assert.equal(classify({title:'Central bank announces interest rate cut'}).primary,'macro'));
test('advanced chip export rules classify as policy or semiconductors with both detected',()=>{const c=classify({title:'New export control on advanced semiconductor chips'});assert.ok(c.topics.some(x=>x.topic==='semiconductors'));assert.ok(c.topics.some(x=>x.topic==='policy'))});
test('nuclear enrichment language receives high severity',()=>{const c=classify({title:'IAEA reports uranium enrichment and centrifuge expansion'});assert.equal(c.primary,'nuclear');assert.ok(c.categoryWeight>1)});
