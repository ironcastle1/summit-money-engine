const express = require('express');
const { snapshot, subscribe } = require('../services/state');
const { refreshNow } = require('../services/scheduler');
const { getCountryContext } = require('../services/contextService');
const { mapNodes, cityNodes, routes } = require('../data/mapData');
const { getJson } = require('../services/http');

const router = express.Router();
router.get('/snapshot', (req,res) => res.json(snapshot()));
router.get('/stream', subscribe);
router.post('/refresh', async (req,res) => res.json(await refreshNow()));
router.get('/map', (req,res) => res.json({ nodes: mapNodes, cityNodes, routes }));
router.get('/context', (req,res) => {
  const lat = Number(req.query.lat); const lng = Number(req.query.lng);
  res.json(getCountryContext(lat,lng, snapshot()));
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
module.exports = router;
