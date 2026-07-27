# Summit Security Companion v1

Europe-first travel security, family-safety, off-grid resilience and money intelligence companion.

## Deploy on Render

Build Command:

```bash
npm install --package-lock=false --no-audit --no-fund
```

Start Command:

```bash
npm start
```

Root Directory: leave blank.

## Main features

- Travel Security tab
- Family Watch for Syria / Middle East / Ukraine priority cities
- Europe-first security view
- Middle East / Syria watch view
- Click-any-place intelligence card
- Country risk map colours
- War overlay ON by default
- Crisis and watch overlays OFF by default
- Real source health page
- No fake local data rule

## Scrapers / collectors

- GDELT global security and travel events
- ReliefWeb humanitarian reports
- USGS earthquakes
- GDACS disasters
- NASA EONET natural hazards
- US National Weather Service alerts
- Open-Meteo local weather
- UK data.police.uk local crime
- Nominatim reverse geocode and place search
- Overpass local infrastructure
- Wikipedia / Wikimedia place images
- World Bank national crime/economic/governance indicators
- UK FCDO travel advice pages
- Binance crypto market data
- CoinGecko crypto fallback
- Yahoo Finance commodity charts
- ECB FX rates

## Data rule

If the source is local, it is labelled local. If it is national, it is labelled national. If it is an event feed, it is labelled live-event. Missing data is shown as missing instead of faked.
