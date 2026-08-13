import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_SIGNAL_INDICATORS } from '../src/catalog/public-signal-indicators.js';
import { matchPublicSignalIndicators } from '../src/intel/public-signal-context.js';

test('public indicator catalogue covers major observable signal lanes',()=>{
  assert.ok(PUBLIC_SIGNAL_INDICATORS.length>=45);
  const lanes=new Set(PUBLIC_SIGNAL_INDICATORS.map(x=>x.lane));
  for(const lane of ['defense','maritime','sanctions','cyber','energy','nuclear','finance','infrastructure','technology']) assert.ok(lanes.has(lane),`missing ${lane}`);
});

test('public indicator matcher finds Gulf posture and shipping indicators',()=>{
  const cluster={records:[{title:'Additional forces deploy as tanker operators reroute around regional threat',summary:'Force protection measures rise while war-risk premiums increase.'}]};
  const hits=matchPublicSignalIndicators(cluster);
  assert.ok(hits.some(x=>x.id==='force-forward-deployment'));
  assert.ok(hits.some(x=>x.id==='war-risk-insurance'));
});
