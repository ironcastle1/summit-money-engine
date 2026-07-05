# Summit Money Engine - Part 14

Version: `SUMMIT-MONEY-ENGINE-PART15-OPEN-CONFLICT-DATA-STACK`

Part 14 adds:

- X Live tab removed.
- Subtitle changed to: artificial intelligence data interpretation for user gain and security.
- ACLED removed as a requirement. Open conflict/disaster stack added: GDELT + ReliefWeb + USGS + optional UCDP token.
- Local town/city/facility dots from OpenStreetMap Overpass when zoomed in.
- Click-anywhere context now resolves the actual place/country and includes English country naming.
- Country cards include national averages where World Bank publishes them:
  - intentional homicide per 100k
  - population
  - GDP per capita
- UK local crime remains source-backed through data.police.uk.
- The app does not fabricate exact frontlines or global street-level crime.

Optional Render environment variables:

```txt
UCDP_TOKEN=optional_ucdp_api_token
```

Render:

```txt
Build Command: npm install --package-lock=false --no-audit --no-fund
Start Command: npm start
```


## Part 15 open-data conflict stack

This version does not require ACLED. It uses GDELT for live news/event monitoring, ReliefWeb for disasters/humanitarian reports, USGS for earthquake events, and optional UCDP GED when a free UCDP API token is available. It does not fabricate X posts, exact frontlines, or global street-level crime.
