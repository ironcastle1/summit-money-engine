# Part 19: Public-First Live Data

Part 19 makes the core intelligence product operate without mandatory third-party API keys. It automatically warms public sources, persists successful live responses to disk, exposes source coverage and attribution, and falls back to the last successful live snapshot when an upstream source is temporarily unavailable.

## Keyless core

The default public-first layer includes GDELT/RSS, USGS, NASA EONET, GDACS, World Bank, ECB reference rates, FRED graph CSV, public crypto exchange endpoints, Polymarket, the UN Security Council consolidated sanctions list, UN Comtrade preview data, IMF PortWatch catalogue metadata, NOAA coastal and buoy observations, Environment Agency flood warnings and NWS alerts.

## Honest boundary

Global vessel-by-vessel satellite AIS positions cannot be redistributed lawfully or reliably without a provider agreement. The platform therefore treats global AIS as an optional licensed enhancement. The map and route engine continue to work with ports, corridors, chokepoints, public trade data, marine conditions, official notices, hazard exposure and route-risk modelling without AIS.

## Persistence

The live-data snapshot file defaults to `runtime-data/live-data.json`. It stores the latest successful result per source and the most recent refresh runs. Cached records are clearly labelled `CACHED`; they are never represented as current live observations.
