# Summit Money Engine - Part 6

Map-first live money intelligence prototype.

Version expected at `/health`:

```text
SUMMIT-MONEY-ENGINE-PART6-BLUE-MAP-ROUTES-SIDEINFO
```

## Key fixes in Part 6

- Blue-toned map layer: dark blue ocean/land treatment with visible labels.
- Map fills the viewport when zoomed out using fractional minimum zoom and no map repetition.
- Side panels are overlays; map remains the main product area.
- Marker details open in the side panel, not over the map.
- Toggle buttons can open/close panels without relying on the X button.
- Local city nodes appear when zoomed in.
- More port, energy, finance, city, commodity and risk nodes.
- More route lines with route descriptions, goods carried and watch assets.
- Slower moving route-flow dots.
- Charts have x/y axis labels and real line charts.
- Event feeds use GDELT/ReliefWeb and optional X API token; unsupported/unguessed crime data is not fabricated.
- Wikipedia/Wikimedia location images are used only when a verified page thumbnail is available; no random stock images.

## Render

Build command:

```text
npm install --package-lock=false --no-audit --no-fund
```

Start command:

```text
npm start
```

Optional env:

```text
X_BEARER_TOKEN=<official X API bearer token>
```
