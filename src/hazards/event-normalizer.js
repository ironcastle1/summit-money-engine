import {
  classifyHazard
}
from './hazard-classifier.js';
import {
  pointOf
}
from './geo.js';
import {
  iso
}
from './time.js';
import {
  severityIndex
}
from './severity-band.js';
function text(value, max=300) {
  return String(value??'').replace(/\s+/g, ' ').trim().slice(0, max);
}
export function normalizeHazardEvent(input= {
}) {
  const point=pointOf(input);
  if(!point)return null;
  const type=classifyHazard(input);
  const severity=severityIndex(input);
  const attributes=Object.freeze( {
    ...input.attributes
  });
  return Object.freeze( {
    id:text(input.id||input.sourceId||`${type}-${point.lat}-${point.lon}-${input.time}`, 160), source:text(input.source||'Unknown', 80), sourceId:text(input.sourceId||'', 160)||null, title:text(input.title||type.replaceAll('_', ' '), 240), summary:text(input.summary||input.description||'', 800), type, category:String(input.category||'').toLowerCase(), point, time:iso(input.time||input.startedAt||input.updatedAt||Date.now()), updatedAt:iso(input.updatedAt||input.time||Date.now()), severityScore:severity.score, severityBand:severity.band, magnitude:Number.isFinite(Number(input.magnitude))?Number(input.magnitude):null, alertLevel:text(input.alertLevel||attributes.alertLevel||'', 40)||null, country:text(input.country||'', 100)||null, region:text(input.region||'', 160)||null, url:input.url||null, attributes, raw:input
  });
}
export function normalizeHazardEvents(records=[]) {
  return records.map(normalizeHazardEvent).filter(Boolean);
}
