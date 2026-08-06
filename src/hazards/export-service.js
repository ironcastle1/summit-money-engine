import {
  hazardFeatureCollection
}
from './map-features.js';
function csv(value) {
  const text=String(value??'');
  return /[",\n]/.test(text)?`"${text.replaceAll('"','""')}"`:text;
}
export class HazardExportService {
  toGeoJson(events, options= {
  }) {
    return hazardFeatureCollection(events, options);
  }
  toCsv(events=[]) {
    const rows=[['id', 'title', 'type', 'score', 'band', 'time', 'latitude', 'longitude', 'source', 'country', 'region']];
    for(const e of events)rows.push([e.id, e.title, e.type, e.materiality?.score||e.severityScore, e.severityBand, e.time, e.point.lat, e.point.lon, e.source, e.country, e.region]);
    return rows.map(row=>row.map(csv).join(',')).join('\n');
  }
  summary(events=[]) {
    return Object.freeze( {
      count:events.length, material:events.filter(e=>e.materiality?.material).length, byType:Object.freeze(events.reduce((a, e)=>(a[e.type]=(a[e.type]||0)+1, a), {
      })), maximumScore:Math.max(0, ...events.map(e=>e.materiality?.score||0)), generatedAt:new Date().toISOString()
    });
  }
}
