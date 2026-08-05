# Part 06 — Overlay and Layer Catalogue

This release adds the market-facing thematic overlay system used by the Merlin map. It contains more than fifty independently controlled layers across reference geography, terrain, conflict, politics, logistics, hazards, infrastructure, humanitarian conditions, markets and verification quality.

The system distinguishes static catalogues, live feeds, derived analysis, tile sources and connectors. Missing connectors are shown as unavailable and return empty collections; the application does not fabricate live observations. Earthquakes are retained only when they cross the material-impact policy or explicitly affect shipping, infrastructure or sovereign operations.

Client controls include grouped layers, presets, visibility, opacity, filters, source status, freshness, legends, persistence, URL state and viewport-driven loading. The core map engine gains polygon, heat and raster renderer support and a dynamic overlay registration API.
