const { getJson } = require('./http');
async function fetchEarthquakes(){
  try{
    const url='https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson';
    const data=await getJson(url,{timeout:12000});
    return (data.features||[]).map(f=>{
      const [lng,lat,depth] = f.geometry?.coordinates || [];
      const mag = f.properties?.mag;
      return { id:`usgs-${f.id}`, kind:'disaster', title:f.properties?.title || `M${mag} earthquake`, lat, lng, place:f.properties?.place || 'earthquake', source:'USGS', url:f.properties?.url || '#', time:new Date(f.properties?.time || Date.now()).toISOString(), summary:`Magnitude ${mag}; depth ${depth ?? 'unknown'} km.`, watch:['insurance','construction','local FX','energy infrastructure'], sources:[{name:'USGS earthquake feed',url:f.properties?.url||'https://earthquake.usgs.gov/earthquakes/feed/'}], verifiedLocation:true, severity: mag>=6?'high':mag>=5?'medium':'monitor' };
    }).filter(e=>Number.isFinite(e.lat)&&Number.isFinite(e.lng));
  }catch(e){ return [] }
}
module.exports={ fetchEarthquakes };
