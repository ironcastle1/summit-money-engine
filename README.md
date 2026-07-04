# Summit Money Engine — Part 7

Map-first live world monitoring build.

Health check:

```text
SUMMIT-MONEY-ENGINE-PART7-LIVE-WORLD-MAP-BLUE
```

## Changes in Part 7

- Map colour corrected toward mid/dark navy blue instead of black/pink.
- Top ticker arrows now render green/red based on live percentage direction.
- Map starts at a zoom that fills the viewport without duplicate worlds.
- Route animation changed from fast dots to slower moving line flow.
- Added more shipping and land-trade corridors with route goods, direction, watched assets and verification notes.
- Added a much denser global city monitoring grid so city dots appear when zooming in.
- Clicked map/city/route/event information opens in the side panel, not in a popup covering the map.
- City cards attempt to show accurate Wikipedia/Wikimedia location thumbnails only. If not verified, no image is shown.
- UK crime check added through data.police.uk when coordinates are inside the UK. No global crime scores are fabricated.
- Context panels clearly state when a feed is unavailable instead of inventing data.
- Charts have labelled axes and real chart canvases only.

## Optional live feeds

For X data, add this Render environment variable:

```text
X_BEARER_TOKEN=your_official_x_api_bearer_token
```

Without it the app uses GDELT, ReliefWeb, Polymarket and market feeds.

## Render

```text
Build Command: npm install --package-lock=false --no-audit --no-fund
Start Command: npm start
```
