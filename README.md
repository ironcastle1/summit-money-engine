# Summit Money Engine - Part 2

Version: `SUMMIT-MONEY-ENGINE-PART2-LIVE-TABS-MARKETS`

Part 2 fixes the live deployment foundation:

- Small edge tabs for MARKETS and SIGNALS are always visible.
- Side panels start closed and can be reopened without large map buttons.
- Server-Sent Events stream pushes state to the browser.
- Server refreshes market feeds every 45 seconds.
- Browser asks for a manual refresh every 60 seconds.
- Crypto prices poll Binance ticker endpoints.
- Commodities, ETFs and stocks poll Yahoo intraday chart endpoints first, then daily fallback.
- Price rows show source, status and update age.
- Charts use normal labels so Chart.js renders without a time adapter.
- Polymarket event pulse is visible in the market panel.

## Render

Build command:

```bash
npm install --no-audit --no-fund
```

Start command:

```bash
npm start
```

Health check:

```text
/health
```

Expected:

```text
SUMMIT-MONEY-ENGINE-PART2-LIVE-TABS-MARKETS
```
