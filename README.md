# Summit Money Engine — Part 1

This is the first real multi-file foundation build. It is not a one-file mockup.

## What this part contains

- Express backend
- Map-first frontend
- Hidden side panels opened by discreet edge tabs
- Leaflet HD map layer with blue-toned filter
- Multicolour money-signal markers
- Live crypto data via Binance
- Market proxy data via Yahoo chart endpoints where available
- Polymarket event-market ingestion via public Gamma API
- Signal scoring engine
- Money-only opportunity cards
- Chart drawer for BTC, ETH, SOL, Brent, Gold, Copper, LMT, VRT proxies
- Verification rules before entry
- Local fallback data so the app still runs if APIs fail

## Run locally

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

Health:

```text
http://localhost:3000/health
```

Expected version:

```text
SUMMIT-MONEY-ENGINE-PART1-MAP-FIRST
```

## Render

Build Command:

```bash
npm install
```

Start Command:

```bash
npm start
```

## Upload to GitHub

Upload this whole folder as one repo called:

```text
summit-money-engine
```

Do not upload `node_modules`.

