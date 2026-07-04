# Summit Money Engine — Part 3

Version: `SUMMIT-MONEY-ENGINE-PART3-MAP-EVENTS-RAPID-RISE`

Part 3 adds the map behaviour requested after Part 1 went live:

- top menu tabs above the map instead of side edge tabs
- side panels hidden by default and opened from the top menu
- blue-toned HD Leaflet/CARTO map styling
- map zoom constrained so the world does not repeat endlessly
- live event dots from RSS/GDELT-style event scanning with fallback dots
- new event dots flash and play a short browser sound
- shipping and land trade routes are separately toggleable
- trade routes are solid colour-coded lines with moving direction arrows
- rapid-rise tab with continuation/drop probability projection chart
- popups focus on asset watchlists, source, severity and probability
- no culture/networking/date/secret-agent wording

## Render

Build command:

```bash
npm install --package-lock=false --no-audit --no-fund
```

Start command:

```bash
npm start
```

Health route:

```text
/health
```

Expected:

```text
SUMMIT-MONEY-ENGINE-PART3-MAP-EVENTS-RAPID-RISE
```
