# Summit Money Engine open-intel-v3 rebuild

This replacement removes the fragile GitHub copy-paste patch cycle and restores a single deployable app.

## Main fixes

- Removed Polymarket and route features from the active UI because the user wanted them removed.
- Rebuilt the backend so `/api/state`, `/api/map-data`, `/api/global-risk/point`, `/api/live-brief`, `/api/sources`, `/api/wiki/place`, `/api/global-weather/earthquakes`, and `/api/global-weather/disasters` come from one consistent router.
- War overlay starts ON by default.
- Crisis and watchlist overlays start OFF until toggled from the left map controls.
- Dots toggle clears event, city and crisis dots.
- Place click now shows a loading state, then exact reverse-geocoded place, local crime where official data exists, national indicators, weather, air quality, governance indicators, nearby live signals and Wikipedia image lookup.
- No fake global town-level crime. UK local crime uses data.police.uk. Other countries use national indicators and live risk signals.
- Rapid Movers and Predictions now build from real market rows when Binance, CoinGecko, Yahoo or Stooq return data.
- Live Brief uses backend-built sections: top live risks, moving markets and how to use the signals.
- Sources tab now shows scraper health and source purpose.

## Scrapers/gatherers included

- GDELT English-filtered live events
- ReliefWeb reports
- NASA EONET natural hazards
- US National Weather Service alerts
- USGS earthquakes
- GDACS disasters RSS
- Open-Meteo weather
- Open-Meteo air quality
- Binance crypto ticker
- CoinGecko crypto fallback
- Yahoo Finance chart prices
- Stooq CSV fallback
- ECB FX rates
- World Bank homicide/GDP/inflation/governance indicators
- data.police.uk local crime for UK points
- Nominatim/OpenStreetMap reverse geocoding and search
- Overpass/OpenStreetMap local infrastructure
- Wikipedia/Wikimedia images and summaries

## Render settings

Build Command:

```text
npm install --package-lock=false --no-audit --no-fund
```

Start Command:

```text
npm start
```

Root Directory: leave blank.
