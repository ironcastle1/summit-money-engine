# MERLIN V18.0.0

Merlin is a map-first world-data and commercial-opportunity platform. The browser loads a complete local operating snapshot immediately, then refreshes independent live sources in the background. A failed upstream feed cannot prevent the map, navigation, markets, shipping, places or opportunity screens from opening.

## Main interface

- Interactive world map with direct detailed street tiles, a same-origin tile-proxy fallback and a 742-path local political fallback.
- Mouse/touch pan, wheel zoom, double-click zoom, place search, geolocation and selectable map entities.
- Toggleable alert, news, earthquake, disaster, conflict, shipping-route, port, country-risk and activity-heat layers.
- All earthquake magnitudes remain available on the map.
- News and live alerts are integrated into the map and drawers.
- Markets and commodity supply-risk readings appear in the permanent strip below the header.
- Opportunities specify the destination, action, target customer, starting capital, time window and estimated value.
- Shipping ranks routes, ports and commodities by commercial use rather than showing a decorative map only.
- Countries without measured evidence show no risk score rather than a universal placeholder.
- Audio is disabled.

## Immediate local coverage

The bundled bootstrap contains more than 2,000 event records, verified-news snapshots, 75 ports, 15 shipping corridors, 11 commodity groups, 232 countries, 259 cities, eight market quotes and 50 starting opportunities. These records render before any live request.

## Live source adapters

### Events and hazards

- USGS earthquake GeoJSON
- NASA EONET natural events
- GDACS disaster alerts
- US National Weather Service alerts
- UK Environment Agency flood warnings
- UN OCHA ReliefWeb disasters
- ACLED when an access token is configured

### News and markets

- GDELT
- Configurable RSS feeds
- X only when `X_BEARER_TOKEN` is configured
- Coinbase Exchange, Binance and CoinGecko
- Alpha Vantage when configured
- FRED macro/commodity series
- Polymarket discovery

### Shipping and places

- NOAA CO-OPS water-level observations
- NOAA NDBC marine observations
- IMF PortWatch when an endpoint is configured
- UN Comtrade
- EIA when configured
- World Bank indicators
- UK Police data for supported UK coordinates
- ReliefWeb reports
- Google Civic when configured

## Install and run

```bash
npm start
```

Open `http://localhost:4173`.

For production, set at minimum:

```text
NODE_ENV=production
SESSION_SECRET=at-least-32-random-characters
PUBLIC_ORIGIN=https://your-domain.example
SECURE_COOKIES=true
```

## Verification

```bash
npm test
python scripts/browser-smoke.py
npm run verify
npm run preflight
npm run security:scan
npm run lines
```

The Chromium smoke test uses the shipped HTML, CSS, JavaScript, logo and bootstrap data. It verifies browser startup, map rendering, map drag, layer controls, clickable markers, detail panels, all four secondary views and the absence of browser errors.

## GitHub browser upload

GitHub's website accepts at most 100 files per upload. Use the separately supplied numbered ZIP batches. Extract each ZIP and drag its contents into the repository root, committing each batch in sequence. Hidden files such as `.gitignore`, `.dockerignore`, `.env.example` and `.github/workflows/ci.yml` are intentional. Never commit a real `.env` file or credentials.

## Data integrity

Merlin does not generate random live-looking numbers. Unsupported or unavailable measurements remain absent. Bundled snapshots are identified as snapshots and are replaced only by successfully returned live data.
