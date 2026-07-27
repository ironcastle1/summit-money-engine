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
