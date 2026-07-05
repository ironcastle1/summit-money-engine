# Summit Money Engine

Map-first live market, place, safety and event intelligence.

## What This Build Does

- Opens on the map as the main screen.
- Searches cities, towns and countries through OpenStreetMap Nominatim.
- Shows source-backed city/town cards with OpenStreetMap, Wikipedia/Wikidata, and country context.
- Pulls live crypto prices and candles from Binance public APIs.
- Pulls delayed-live commodity, ETF and stock prices/candles from Yahoo Finance chart endpoints.
- Pulls source-linked event dots from GDELT, ReliefWeb, USGS and optional UCDP.
- Pulls UK local crime from data.police.uk when the clicked point is in the UK.
- Pulls country indicators from the World Bank where published.
- Shows Safety / Crime / Money indexes only from available source-backed inputs.
- Shows `N/A` when a value is missing instead of filling fake data.
- Keeps route layers off by default.
- Colours country polygons for safety/conflict layers, not fake safety bubbles.
- Provides Live Brief and Sources panels for launch-day debugging and user value.

## Real Sources

- Binance public API: crypto prices and candles.
- Yahoo Finance chart endpoint: commodity futures, ETFs, equities and candles.
- World Bank Indicators API: country-level homicide, GDP, population and macro indicators.
- data.police.uk: UK street-level crime by location and latest available month.
- GDELT: live source-linked global news/events.
- ReliefWeb: humanitarian/disaster reports.
- USGS: recent earthquake feed.
- UCDP GED: optional organized violence feed when `UCDP_TOKEN` is configured.
- OpenStreetMap Overpass: visible towns, cities and facilities.
- OpenStreetMap Nominatim: search and reverse geocoding.
- Wikipedia/Wikidata: place summaries and images where available.
- Polymarket Gamma API: active market names, volume and liquidity.

## Important Data Rules

- No fake market prices.
- No fake chart lines.
- No fake Polymarket fallback rows.
- No static monitor points masquerading as live events.
- No invented street-level crime outside official connected feeds.
- Missing data renders as `N/A`.

## Run Locally

```bash
npm install --package-lock=false --no-audit --no-fund
npm start
```

Open:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/health
```

## Render Deploy

This repo includes `render.yaml`.

Render settings:

- Build command: `npm install --package-lock=false --no-audit --no-fund`
- Start command: `npm start`
- Node: `20.x`

Optional environment variables:

- `UCDP_TOKEN`: enables UCDP conflict events.
- `X_BEARER_TOKEN`: enables official X API ingestion if you want it later.

The app still works without optional tokens; optional feeds show as missing rather than being faked.

## Main API Endpoints

- `GET /api/snapshot` current app state.
- `POST /api/refresh` refreshes feeds.
- `GET /api/map` map nodes, routes and country polygons.
- `GET /api/context?lat=&lng=` country/place context for a clicked point.
- `GET /api/search-place?q=` OpenStreetMap place search.
- `GET /api/local-places?south=&west=&north=&east=&zoom=` local OSM places/facilities.
- `GET /api/wiki?title=&wikidata=` Wikipedia/Wikidata enrichment.
- `GET /api/brief` live measured brief from current state.
- `GET /api/sources` source catalogue.
- `GET /api/feed-status` compact feed status.

## Launch Notes

This is a source-backed dashboard, not financial advice, travel advice or a policing database. It is built to help users inspect real signals quickly and notice where data is missing.
