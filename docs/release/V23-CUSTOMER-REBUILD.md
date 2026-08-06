# Merlin V23 customer rebuild

## Product direction

V23 removes the internal command-centre presentation from the paying-user interface. The customer product is organised around current information, map inspection, commercial research leads, markets, conflicts, countries, a daily briefing and saved items.

## Customer interface changes

- Customer navigation contains seven useful workspaces only.
- The theme selector and customer-facing administration sections are removed.
- Copy uses ordinary commercial and research language.
- The logo is an inline SVG, eliminating missing-logo requests.
- Panels, drawers, feeds and workspaces use visible independent scrollbars.
- Desktop and mobile layouts use the same information hierarchy.

## Map corrections

- Fixed viewport zoom access used by map layers. Markers and labels now render against the active zoom level.
- Copied country, city, port and route catalogues into production-served public data paths.
- Changed the basemap to direct no-label CARTO tiles.
- Kept old tiles visible while replacement zoom tiles load.
- Bounded concurrency for map tiles.
- Reduced wheel and touchpad zoom sensitivity with aggregation and throttling.
- English labels render first; optional local labels are subordinate at closer zoom.
- Reduced low-zoom label density.
- Events, news, ports and routes are clickable and open a scrollable detail panel.

## Data corrections

- Removed earthquake ingestion and customer earthquake layers.
- Suppressed earthquake and seismic terms at service and browser boundaries.
- Default customer window is 24 hours; maximum is 48 hours.
- Removed stale fallback news and event records.
- API calls run concurrently with hard browser deadlines.
- Static reference data and the map become usable before external feeds return.
- Empty states describe missing current data instead of displaying old records.

## Commercial value

Opportunity records show:

- Why the signal may matter.
- Who could benefit.
- A potential customer group.
- An immediate research action.
- A verification step before acting.

The daily briefing is generated from the same current-window data and includes the main changes, disruptions, possible commercial effects, market movers and next checks.

## Acceptance evidence

- Complete Node test suite: 731 passed.
- JavaScript syntax: 1,717 files passed.
- Rendered Chromium customer tests: desktop and mobile passed with no failed assertions.
- Import graph: passed.
- Embedded-secret scan: passed.
- Production server smoke test: startup, health, index, browser entry and public data assets passed.
