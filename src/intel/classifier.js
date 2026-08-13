import { TOPIC_TERMS, CATEGORY_WEIGHTS, detectTopics } from '../catalog/topics.js';
import { cleanText } from './text.js';
import { matchEventTypes } from './event-taxonomy.js';
const SEVERITY=[
  [28,['nuclear attack','invasion','blockade','strait closed','canal closed','major cyberattack','state of emergency']],
  [20,['airstrike','missile attack','retaliation','mobilisation','mobilization','port closure','airspace closed','capital controls','bank failure']],
  [13,['sanctions','export control','tariff','production cut','rate hike','rate cut','military exercise','ceasefire','strike action']],
  [7,['warning','talks','proposal','investigation','review','concern']]
];
export function classify(record){
  const text=cleanText(`${record.title||''} ${record.summary||''}`); const topics=detectTopics(text);
  const primary=record.categoryHint||topics[0]?.topic||'other'; let severity=0; const lower=text.toLowerCase();
  for(const [points,terms] of SEVERITY)if(terms.some(t=>lower.includes(t)))severity=Math.max(severity,points);
  if(record.magnitude>=7)severity=Math.max(severity,24); else if(record.magnitude>=6.5)severity=Math.max(severity,16);
  const eventTypes=matchEventTypes(record);
  return {primary:eventTypes[0]?.category||primary,topics,severity,eventTypes,eventType:eventTypes[0]||null,categoryWeight:CATEGORY_WEIGHTS[eventTypes[0]?.category||primary]||CATEGORY_WEIGHTS.other};
}
export { TOPIC_TERMS };
