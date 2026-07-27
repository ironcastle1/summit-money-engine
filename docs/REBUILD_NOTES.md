# v2 fixed notes

This package is a correction pass after the first security companion build.

Critical fixes:

- Removed family and Europe tabs.
- Prevented ocean clicks from showing land safety and crime cards.
- Map is bounded with no wrapping map copies.
- War overlay only colours countries with war hits.
- Crisis/watch overlays are opt-in.
- GDELT location logic no longer uses article source country as event country.
- Live brief focuses on actionable security and travel signals.
- City Risk tab explains local-vs-national data.

Important limitation:

Local crime is only available where a real official local crime feed exists. For the UK, the app uses data.police.uk around the clicked point. Other countries use national indicators and live event feeds unless a specific local source is added later.

## v4 Area Scan

Added Radius Security Scan feature.

- New tab: AREA SCAN
- User types a street, area, town, city, airport or border point
- Backend geocodes with Nominatim
- Map zooms to result and draws visible radius circle
- Default radius: 5 miles
- Backend scans within radius for emergency infrastructure through Overpass
- Checks hospitals, clinics, pharmacies, police stations, embassies/consulates, airports, fuel stations, border crossings, ports/harbours, rail stations and main roads
- Checks local UK crime where data.police.uk is available
- Checks nearby live security/crisis/politics/movement signals
- Returns SAFE / CAUTION / AVOID / UNKNOWN verdict
- Shows what to check before moving
- Shows data quality rules and source limitations

New endpoint:

POST /api/area-scan

Payload:

{ "query": "Old City Damascus", "radiusMiles": 5 }
