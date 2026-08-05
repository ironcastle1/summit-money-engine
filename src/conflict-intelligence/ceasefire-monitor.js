import {
  sortNewest,
  ageHours
}
from './time.js';
export function ceasefireStatus(events = [],
now = Date.now()) {
  const ceasefires = sortNewest(events.filter(event => event.type === 'CEASEFIRE')),
  violations = sortNewest(events.filter(event => event.type === 'CEASEFIRE_VIOLATION')),
  latest = ceasefires[0] || null,
  postAgreement = latest ? violations.filter(event => new Date(event.time) >= new Date(latest.time)) : violations;
  return Object.freeze({
    active: Boolean(latest) && ageHours(latest.time,
    now) <= 2160,
    agreement: latest,
    violations: postAgreement,
    violationCount: postAgreement.length,
    status: !latest ? 'NONE' : postAgreement.length ? 'VIOLATED' : 'HOLDING'
  });
}
