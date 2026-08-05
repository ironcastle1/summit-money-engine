import {
  HAZARD_TYPES
}
from './constants.js';
import {
  pointOf
}
from './geo.js';
export function normalizeSnapshotRequest(input= {
}) {
  const types=(Array.isArray(input.types)?input.types:String(input.types||'').split(',')).map(x=>String(x).trim().toUpperCase()).filter(x=>HAZARD_TYPES.includes(x));
  return Object.freeze( {
    types:Object.freeze(types), bounds:input.bounds||null, maximumAgeHours:Math.max(1, Math.min(24*365, Number(input.maximumAgeHours||336))), materialOnly:input.materialOnly!==false, limit:Math.max(1, Math.min(5000, Number(input.limit||1000))), policy:input.policy|| {
    }
  });
}
export function validateScenario(input= {
}) {
  const event=input.event||input;
  if(!pointOf(event))throw Object.assign(new Error('Scenario latitude and longitude are required'), {
    code:'HAZARD_POINT_REQUIRED', statusCode:400
  });
  return input;
}
export function validateExposureInput(input= {
}) {
  if(!Array.isArray(input.assets))throw Object.assign(new Error('assets must be an array'), {
    code:'HAZARD_ASSETS_REQUIRED', statusCode:400
  });
  return input;
}
