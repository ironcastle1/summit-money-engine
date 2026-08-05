import {
  circlePolygon
}
from './geo.js';
import {
  DEFAULT_RADIUS_KM
}
from './constants.js';
export function hazardFeature(event) {
  return Object.freeze( {
    type:'Feature', id:event.id, geometry:Object.freeze( {
      type:'Point', coordinates:Object.freeze([event.point.lon, event.point.lat])
    }), properties:Object.freeze( {
      id:event.id, title:event.title, type:event.type, score:event.materiality?.score||event.severityScore, band:event.materiality?.impact?.band||event.severityBand, time:event.time, source:event.source, material:event.materiality?.material===true
    })
  });
}
export function hazardFootprintFeature(event, radiusKm=DEFAULT_RADIUS_KM[event.type]||120) {
  return Object.freeze( {
    type:'Feature', id:`footprint-${event.id}`, geometry:Object.freeze( {
      type:'Polygon', coordinates:Object.freeze([Object.freeze(circlePolygon(event.point, radiusKm))])
    }), properties:Object.freeze( {
      id:event.id, type:event.type, radiusKm, score:event.materiality?.score||event.severityScore
    })
  });
}
export function hazardFeatureCollection(events=[], options= {
}) {
  const features=[];
  for(const event of events) {
    features.push(hazardFeature(event));
    if(options.includeFootprints)features.push(hazardFootprintFeature(event, options.radiusKm));
  }
  return Object.freeze( {
    type:'FeatureCollection', features:Object.freeze(features), metadata:Object.freeze( {
      generatedAt:new Date().toISOString(), count:features.length
    })
  });
}
