const express = require('express');
const { snapshot, subscribe } = require('../services/state');
const { refreshNow } = require('../services/scheduler');
const { getCountryContext } = require('../services/contextService');
const { getLocalPlaces } = require('../services/localPlaceService');
const { fetchUcdpEvents } = require('../services/ucdpService');
const { fetchEarthquakes } = require('../services/usgsService');
const { mapNodes, cityNodes, routes, riskRegions, safetyRegions, conflictCountries, safetyCountries } = require('../data/mapData');
const { getJson } = require('../services/http');
const { searchPlaces } = require('../services/placeSearchService');
const { summarizeCoverage } = require('../services/sourceCatalog');
const { buildBrief } = require('../engines/briefEngine');

const router = express.Router();
router.get('/snapshot', (req,res) => res.json(snapshot()));
router.get('/stream', subscribe);
router.post('/refresh', async (req,res) => res.json(await refreshNow()));
router.get('/map', (req,res) => res.json({ nodes: mapNodes, cityNodes, routes, riskRegions, safetyRegions, conflictCountries, safetyCountries }));
router.get('/feed-status', async (req,res) => res.json({ gdelt:'open live news/event layer', reliefWeb:'open disaster/humanitarian reports', usgs:'open earthquake feed', ucdp:!!process.env.UCDP_TOKEN ? 'token configured' : 'optional token not set', crime:'UK data.police.uk only; global local crime requires official/licensed city feeds', worldBank:'national indicators available where published' }));
router.get('/sources', (req,res) => res.json(summarizeCoverage()));
router.get('/brief', (req,res) => res.json(buildBrief(snapshot())));
router.get('/search-place', async (req,res) => res.json(await searchPlaces(req.query.q, req.query.limit)));

router.get('/local-places', async (req,res) => {
  res.json(await getLocalPlaces({ south:req.query.south, west:req.query.west, north:req.query.north, east:req.query.east, zoom:req.query.zoom }));
});
router.get('/open-conflict-status', async (req,res) => {
  const [ucdp, quakes] = await Promise.all([fetchUcdpEvents({ days:30, limit:25 }), fetchEarthquakes()]);
  res.json({ ucdp:{ configured:ucdp.configured, status:ucdp.status, count:ucdp.events.length }, usgs:{ configured:true, status:'USGS open earthquake GeoJSON feed', count:quakes.length }, gdelt:'GDELT open live news/events layer', reliefWeb:'ReliefWeb open disasters/report layer' });
});

router.get('/context', async (req,res) => {
  const lat = Number(req.query.lat); const lng = Number(req.query.lng);
  res.json(await getCountryContext(lat,lng, snapshot()));
});
router.get('/reverse', async (req,res)=>{
  const lat=Number(req.query.lat), lng=Number(req.query.lng);
  try{
    const url=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
    const d=await getJson(url,{headers:{'User-Agent':'SummitMoneyEngine/0.6 contact=dashboard'},timeout:8000});
    res.json({ ok:true, place:d.display_name, address:d.address });
  }catch(e){ res.json({ ok:false, error:'reverse lookup unavailable' }); }
});
router.get('/image', async (req,res)=>{
  const title=String(req.query.title||'').slice(0,80);
  if(!title) return res.json({ok:false});
  try{
    const search=`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const d=await getJson(search,{timeout:8000});
    res.json({ok:!!d.thumbnail?.source, title:d.title, image:d.thumbnail?.source||null, source:d.content_urls?.desktop?.page||null, extract:d.extract||''});
  }catch(e){ res.json({ok:false}); }
});
router.get('/wiki', async (req,res)=>{
  const wikidata=String(req.query.wikidata||'').trim();
  let title=String(req.query.title||'').trim().slice(0,120);
  try{
    if(wikidata && /^Q\d+$/.test(wikidata)){
      const entityUrl=`https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(wikidata)}.json`;
      const wd=await getJson(entityUrl,{timeout:9000});
      title=wd?.entities?.[wikidata]?.sitelinks?.enwiki?.title || title;
    }
    if(!title) return res.json({ok:false});
    const url=`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const d=await getJson(url,{timeout:9000});
    res.json({
      ok:true,
      title:d.title || title,
      image:d.thumbnail?.source || d.originalimage?.source || null,
      extract:d.extract || '',
      source:d.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
    });
  }catch(e){
    res.json({ok:false, title, image:null, extract:'', source:null});
  }
});
module.exports = router;
