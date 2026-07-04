# Summit Money Engine Part 5

Map-first event intelligence terminal focused on market-moving events.

## Health
`/health` should return `SUMMIT-MONEY-ENGINE-PART5-EVENT-MAP-MONEY`.

## Render
Build command: `npm install --package-lock=false --no-audit --no-fund`
Start command: `npm start`

## Optional X API
Set `X_BEARER_TOKEN` in Render to enable official X search. Without it the engine uses GDELT, ReliefWeb, Polymarket, Binance, and Yahoo-style public chart endpoints.
