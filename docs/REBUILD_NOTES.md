# Summit Security Companion v4.2 Radius Intelligence Fix

This build fixes the Area Scan and data display problems reported after v4.1.

## Changed

- Main search remains the 5-mile Area Scan workflow.
- Area Scan now returns radius estimates, not just a circle.
- Radius estimates are labelled as ESTIMATE and based on loaded public-source data.
- UK local crime now samples the centre point plus four nearby points for a more useful radius estimate.
- Country Risk tab removed from the top nav; country risk appears in clicked place / scan context instead.
- Live Brief now filters out low-value noise and focuses on security, travel, movement and serious crisis signals.
- Added Security News RSS collector using BBC, Guardian, Al Jazeera, NPR and Google News RSS search feeds.
- Top ticker now uses green/red arrows instead of grey plain text.

## Data rule

No score should be treated as exact unless its card says LOCAL/OFFICIAL. Estimated values are public-source estimates based on live events, official national indicators, local crime where available, OSM infrastructure, weather, and travel advice.
