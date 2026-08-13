import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureResults } from '../src/sources/fixture.js';
import { runIntelligencePipeline } from '../src/intel/pipeline.js';

test('hot-country clustering keeps sanctions nuclear and force-posture developments separate',()=>{
  const f=fixtureResults();
  const p=runIntelligencePipeline({rawItems:f.items,markets:f.markets,predictions:f.predictions,sourceStatuses:[]});
  const ofac=p.signals.find(x=>x.title.startsWith('OFAC announces'));
  const iaea=p.signals.find(x=>x.title.startsWith('IAEA issues'));
  const posture=p.signals.find(x=>x.title.startsWith('US military adjusts'));
  assert.ok(ofac&&iaea&&posture);
  assert.deepEqual(ofac.intelligence.publicIndicators.map(x=>x.id),['sanctions-new-designation']);
  assert.ok(iaea.intelligence.publicIndicators.some(x=>x.id==='nuclear-enrichment'));
  assert.ok(!ofac.intelligence.publicIndicators.some(x=>x.id==='nuclear-enrichment'));
});
