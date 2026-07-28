# Summit Security Companion v2 Fixed

Travel security, country risk, city risk, crisis, resilience and money intelligence.

## What changed in v2 fixed

- Removed Family Watch tab.
- Removed Europe tab.
- War overlay starts ON.
- Crisis and Watch overlays start OFF.
- War overlay now uses war event count only, not broad country risk.
- Ocean clicks return an ocean/sea message, not fake land safety scores.
- Main map is bounded and the page no longer scrolls into extra map copies.
- GDELT no longer assigns events to the news source country. It only maps events when the article text names a city or country.
- Live Brief filters to travel/security/crisis/movement signals.
- City Risk tab added as a place-focused feature.
- Place cards label local crime vs national/live data.
- Top ticker restored to useful market IDs where data is loaded.

## Render settings

Build Command:

```bash
npm install --package-lock=false --no-audit --no-fund
```

Start Command:

```bash
npm start
```

Root Directory: leave blank.


## v4.3 requested fixes
- Product title/header text removed from the top bar; only the green status dot remains.
- Area Scan tab removed; the main search is now the radius scan workflow.
- Radius chooser and signal filter added beside the main search.
- Travel Security and Money removed as tabs; movement and money appear as map symbols when relevant events exist.
- War overlay starts on, crisis/watch overlays start off. Red overlay requires strict active conflict logic.
- Dots reduced in size. Earthquakes are shown only at magnitude 5+ and use an earthquake symbol.
- Ocean/unresolved clicks no longer show fake land scores.
- Home button is a house symbol placed directly under map zoom controls.
- Language menu includes Arabic, Ukrainian, Spanish, Russian, Farsi and Turkish, and keeps layout left-to-right.
