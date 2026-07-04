const express = require('express');
const { snapshot, subscribe } = require('../services/state');
const { refreshNow } = require('../services/scheduler');
const { getCountryContext } = require('../services/contextService');
const { mapNodes, routes } = require('../data/mapData');

const router = express.Router();
router.get('/snapshot', (req,res) => res.json(snapshot()));
router.get('/stream', subscribe);
router.post('/refresh', async (req,res) => res.json(await refreshNow()));
router.get('/map', (req,res) => res.json({ nodes: mapNodes, routes }));
router.get('/context', (req,res) => {
  const lat = Number(req.query.lat); const lng = Number(req.query.lng);
  res.json(getCountryContext(lat,lng, snapshot()));
});
module.exports = router;
