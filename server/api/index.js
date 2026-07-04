const express = require('express');
const { getState, onState } = require('../services/stateService');
const { refreshAll } = require('../services/refreshService');
const { getChart } = require('../services/chartService');
const { mapNodes } = require('../data/mapNodes');
const { routeLines } = require('../data/routeLines');
const { getCountryBrief, findCountry } = require('../data/countryBriefs');

const router = express.Router();

router.get('/state', async (req, res) => {
  res.json(getState());
});

router.post('/refresh', async (req, res) => {
  await refreshAll(true);
  res.json(getState());
});

router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (state) => res.write(`event: state\ndata: ${JSON.stringify(state)}\n\n`);
  send(getState());
  const off = onState(send);
  const ping = setInterval(() => res.write(`event: ping\ndata: ${Date.now()}\n\n`), 15_000);
  req.on('close', () => { clearInterval(ping); off(); });
});

router.get('/chart/:symbol', async (req, res) => {
  const symbol = String(req.params.symbol || '').toUpperCase();
  const interval = String(req.query.interval || '15m');
  const limit = Number(req.query.limit || 96);
  res.json(await getChart(symbol, interval, limit));
});

router.get('/map/nodes', (req, res) => {
  const state = getState();
  res.json({ nodes: mapNodes, routes: routeLines, eventDots: state.eventDots || [] });
});


router.get('/map/context', (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const state = getState();
  const country = findCountry(lat, lng);
  const events = (state.eventDots || [])
    .filter(e => Math.abs(Number(e.lat) - lat) < 6 && Math.abs(Number(e.lng) - lng) < 8)
    .slice(0, 12);
  const nodes = mapNodes
    .filter(n => Math.abs(Number(n.lat) - lat) < 6 && Math.abs(Number(n.lng) - lng) < 8)
    .slice(0, 10);
  res.json({ country, events, nodes });
});

router.get('/rapid', (req, res) => {
  res.json({ rapidMoves: getState().rapidMoves || [] });
});

router.get('/country/:code', (req, res) => {
  res.json(getCountryBrief(String(req.params.code || '').toUpperCase()));
});

module.exports = router;
