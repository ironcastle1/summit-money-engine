const productFeatureMatrix = [
  {
    "id": "radius_scan",
    "title": "Radius Security Scan",
    "description": "Search a street/city, draw a radius, return safety % breakdown, event evidence, emergency infrastructure, movement and money checks.",
    "status": "live",
    "ui": "SCAN button"
  },
  {
    "id": "route_planner",
    "title": "Route Safety Planner",
    "description": "Compare origin and destination scans, show route line, stop/check list, border/airport/road risk signals and route verdict.",
    "status": "new-visible",
    "ui": "ROUTE tab"
  },
  {
    "id": "watch_zones",
    "title": "Watch Zones",
    "description": "Save important places and re-check them from the browser. Useful for family/contact sites, hotels, border crossings, warehouses and project sites.",
    "status": "new-visible",
    "ui": "WATCH tab"
  },
  {
    "id": "offline_pack",
    "title": "Offline Field Pack",
    "description": "Generate an offline travel/security pack for a destination with emergency checklist, embassy/infrastructure search terms and movement rules.",
    "status": "new-visible",
    "ui": "OFFLINE tab"
  },
  {
    "id": "threat_matrix",
    "title": "Threat Matrix",
    "description": "Search the operational threat taxonomy and country-specific actions.",
    "status": "new-visible",
    "ui": "THREATS tab"
  },
  {
    "id": "ops_console",
    "title": "Operations Console",
    "description": "High-level overview of product modules, source health, active map signal counts and customer-facing actions.",
    "status": "new-visible",
    "ui": "OPS tab"
  },
  {
    "id": "source_audit",
    "title": "Source Audit",
    "description": "Shows which feeds work, what they support and whether a feature is local, national, live-news or estimated.",
    "status": "live",
    "ui": "SOURCES tab"
  },
  {
    "id": "politics_overlay",
    "title": "Global Politics Overlay",
    "description": "Political unrest, sanctions, coups, elections, embassy notices and government disruption.",
    "status": "live",
    "ui": "POLITICS map button"
  },
  {
    "id": "infrastructure_symbols",
    "title": "Emergency Infrastructure Symbols",
    "description": "Hospitals, clinics, pharmacies, police, embassies, airports, fuel, borders, ports, rail, comms, water, shelter, food and power.",
    "status": "live",
    "ui": "map symbols"
  },
  {
    "id": "live_alerts",
    "title": "Live Alerts",
    "description": "Level 3+ security/movement/crisis signal popup with close button and sound after user interaction.",
    "status": "live",
    "ui": "toast"
  }
];
module.exports = { productFeatureMatrix };
