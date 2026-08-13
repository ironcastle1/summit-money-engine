export const DEPENDENCY_GRAPH = Object.freeze([
  {
    "id": "dep-001",
    "origin": "Persian Gulf exporters",
    "destination": "Global oil market",
    "flow": "Crude oil",
    "regions": [
      "middle-east",
      "world"
    ],
    "strategicNodes": [
      "hormuz"
    ],
    "financialExposures": [
      "brent",
      "tanker"
    ],
    "failureModes": [
      "Hormuz closure",
      "terminal attack",
      "sanctions"
    ],
    "substitutes": [
      "strategic stocks",
      "non-Gulf spare capacity",
      "demand destruction"
    ],
    "monitorIndicators": [
      "tanker transits",
      "export loadings",
      "war-risk premium"
    ],
    "typicalTransmissionLag": "hours-days"
  },
  {
    "id": "dep-002",
    "origin": "Qatar",
    "destination": "Europe/Asia",
    "flow": "LNG",
    "regions": [
      "middle-east",
      "europe",
      "strategic-asia"
    ],
    "strategicNodes": [
      "hormuz",
      "ras-laffan"
    ],
    "financialExposures": [
      "lng-eu",
      "tanker"
    ],
    "failureModes": [
      "Ras Laffan outage",
      "Hormuz disruption"
    ],
    "substitutes": [
      "US LNG",
      "Australia LNG",
      "storage draw"
    ],
    "monitorIndicators": [
      "cargo nominations",
      "terminal status",
      "spot LNG spreads"
    ],
    "typicalTransmissionLag": "hours-weeks"
  },
  {
    "id": "dep-003",
    "origin": "Russia",
    "destination": "Europe",
    "flow": "Natural gas",
    "regions": [
      "russia-eurasia",
      "europe"
    ],
    "strategicNodes": [
      "yamal",
      "druzhba"
    ],
    "financialExposures": [
      "lng-eu",
      "eurusd"
    ],
    "failureModes": [
      "pipeline interruption",
      "sanctions",
      "LNG restriction"
    ],
    "substitutes": [
      "Norway",
      "US LNG",
      "demand reduction"
    ],
    "monitorIndicators": [
      "pipeline flows",
      "storage",
      "TTF spread"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-004",
    "origin": "Russia/Kazakhstan",
    "destination": "Global oil market",
    "flow": "Crude exports",
    "regions": [
      "russia-eurasia",
      "europe"
    ],
    "strategicNodes": [
      "novorossiysk",
      "primorsk",
      "ust-luga"
    ],
    "financialExposures": [
      "brent",
      "tanker",
      "ruble"
    ],
    "failureModes": [
      "port outage",
      "sanctions",
      "CPC disruption"
    ],
    "substitutes": [
      "Middle East barrels",
      "US exports"
    ],
    "monitorIndicators": [
      "loadings",
      "Urals differential",
      "freight"
    ],
    "typicalTransmissionLag": "days-weeks"
  },
  {
    "id": "dep-005",
    "origin": "Ukraine/Russia",
    "destination": "MENA/importers",
    "flow": "Grain",
    "regions": [
      "europe",
      "russia-eurasia",
      "middle-east"
    ],
    "strategicNodes": [
      "odesa",
      "black-sea"
    ],
    "financialExposures": [
      "wheat"
    ],
    "failureModes": [
      "port attack",
      "export ban",
      "navigation risk"
    ],
    "substitutes": [
      "EU land routes",
      "Americas",
      "Australia"
    ],
    "monitorIndicators": [
      "Black Sea offers",
      "freight",
      "port loadings"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-006",
    "origin": "US Gulf Coast",
    "destination": "Europe/Asia",
    "flow": "LNG",
    "regions": [
      "north-america",
      "europe",
      "strategic-asia"
    ],
    "strategicNodes": [
      "freeport-lng",
      "sabine-pass",
      "houston"
    ],
    "financialExposures": [
      "lng-eu"
    ],
    "failureModes": [
      "hurricane",
      "liquefaction outage",
      "channel closure"
    ],
    "substitutes": [
      "Qatar",
      "Australia",
      "storage"
    ],
    "monitorIndicators": [
      "feedgas",
      "port condition",
      "cargo cancellations"
    ],
    "typicalTransmissionLag": "hours-weeks"
  },
  {
    "id": "dep-007",
    "origin": "US Gulf Coast",
    "destination": "Global fuels",
    "flow": "Refined products",
    "regions": [
      "north-america",
      "world"
    ],
    "strategicNodes": [
      "houston"
    ],
    "financialExposures": [
      "wti",
      "brent"
    ],
    "failureModes": [
      "refinery outage",
      "pipeline disruption",
      "hurricane"
    ],
    "substitutes": [
      "European/Asian refineries",
      "inventory draw"
    ],
    "monitorIndicators": [
      "refinery utilization",
      "product stocks",
      "crack spreads"
    ],
    "typicalTransmissionLag": "hours-weeks"
  },
  {
    "id": "dep-008",
    "origin": "Saudi Arabia",
    "destination": "Global oil market",
    "flow": "Crude processing/export",
    "regions": [
      "middle-east",
      "world"
    ],
    "strategicNodes": [
      "abqaiq",
      "ras-tanura"
    ],
    "financialExposures": [
      "brent",
      "tanker"
    ],
    "failureModes": [
      "processing attack",
      "terminal outage"
    ],
    "substitutes": [
      "inventories",
      "spare capacity elsewhere"
    ],
    "monitorIndicators": [
      "Aramco capacity update",
      "loadings",
      "physical differentials"
    ],
    "typicalTransmissionLag": "hours-days"
  },
  {
    "id": "dep-009",
    "origin": "Iran",
    "destination": "China/Asia",
    "flow": "Sanctioned crude",
    "regions": [
      "middle-east",
      "strategic-asia"
    ],
    "strategicNodes": [
      "kharg",
      "hormuz"
    ],
    "financialExposures": [
      "brent",
      "tanker"
    ],
    "failureModes": [
      "OFAC enforcement",
      "terminal disruption"
    ],
    "substitutes": [
      "Russia/Gulf crude"
    ],
    "monitorIndicators": [
      "sanctions designations",
      "dark-fleet activity",
      "loadings"
    ],
    "typicalTransmissionLag": "days-weeks"
  },
  {
    "id": "dep-020",
    "origin": "Taiwan",
    "destination": "Global electronics",
    "flow": "Advanced logic semiconductors",
    "regions": [
      "strategic-asia",
      "north-america",
      "europe"
    ],
    "strategicNodes": [
      "hsinchu",
      "taiwan-strait"
    ],
    "financialExposures": [
      "semis",
      "taiwan-eq"
    ],
    "failureModes": [
      "blockade",
      "fab outage",
      "power/water disruption"
    ],
    "substitutes": [
      "limited US/Japan/Korea capacity",
      "inventory"
    ],
    "monitorIndicators": [
      "fab status",
      "power grid",
      "shipping/air freight",
      "lead times"
    ],
    "typicalTransmissionLag": "hours-months"
  },
  {
    "id": "dep-021",
    "origin": "Taiwan",
    "destination": "Global AI hardware",
    "flow": "Advanced packaging",
    "regions": [
      "strategic-asia",
      "north-america"
    ],
    "strategicNodes": [
      "hsinchu"
    ],
    "financialExposures": [
      "semis"
    ],
    "failureModes": [
      "CoWoS outage",
      "blockade"
    ],
    "substitutes": [
      "new capacity outside Taiwan",
      "inventory"
    ],
    "monitorIndicators": [
      "packaging capacity guidance",
      "customer lead times"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-022",
    "origin": "Netherlands/Japan",
    "destination": "China semiconductor industry",
    "flow": "Lithography/fab equipment",
    "regions": [
      "europe",
      "strategic-asia"
    ],
    "strategicNodes": [
      "rotterdam"
    ],
    "financialExposures": [
      "semis"
    ],
    "failureModes": [
      "export controls",
      "license denial"
    ],
    "substitutes": [
      "domestic Chinese tools",
      "used equipment"
    ],
    "monitorIndicators": [
      "ASML/METI rules",
      "company guidance",
      "China capex"
    ],
    "typicalTransmissionLag": "weeks-years"
  },
  {
    "id": "dep-023",
    "origin": "China",
    "destination": "US/EU/Japan industry",
    "flow": "Rare-earth processing",
    "regions": [
      "strategic-asia",
      "north-america",
      "europe"
    ],
    "strategicNodes": [
      "shenzhen"
    ],
    "financialExposures": [
      "rare-earths",
      "defence-eu"
    ],
    "failureModes": [
      "export licensing",
      "political restriction"
    ],
    "substitutes": [
      "Australia/US mines plus non-China processing",
      "stockpiles"
    ],
    "monitorIndicators": [
      "customs exports",
      "licenses",
      "spot prices"
    ],
    "typicalTransmissionLag": "days-years"
  },
  {
    "id": "dep-024",
    "origin": "China",
    "destination": "Global batteries",
    "flow": "Graphite/anode materials",
    "regions": [
      "strategic-asia",
      "europe",
      "north-america"
    ],
    "strategicNodes": [
      "shenzhen"
    ],
    "financialExposures": [
      "rare-earths",
      "eu-autos"
    ],
    "failureModes": [
      "export control",
      "plant outage"
    ],
    "substitutes": [
      "synthetic graphite",
      "new non-China capacity"
    ],
    "monitorIndicators": [
      "export licenses",
      "battery input prices"
    ],
    "typicalTransmissionLag": "weeks-years"
  },
  {
    "id": "dep-025",
    "origin": "South Korea",
    "destination": "Global electronics",
    "flow": "Memory semiconductors",
    "regions": [
      "strategic-asia",
      "north-america"
    ],
    "strategicNodes": [
      "busan",
      "dmz"
    ],
    "financialExposures": [
      "semis",
      "kospi"
    ],
    "failureModes": [
      "Korean conflict",
      "fab outage",
      "export control"
    ],
    "substitutes": [
      "US/Taiwan/Japan inventory/capacity"
    ],
    "monitorIndicators": [
      "memory pricing",
      "fab status",
      "peninsula alerts"
    ],
    "typicalTransmissionLag": "hours-months"
  },
  {
    "id": "dep-026",
    "origin": "Japan",
    "destination": "Global semiconductor fabs",
    "flow": "Specialty materials/equipment",
    "regions": [
      "strategic-asia",
      "world"
    ],
    "strategicNodes": [
      "yokosuka"
    ],
    "financialExposures": [
      "semis",
      "nikkei"
    ],
    "failureModes": [
      "earthquake",
      "export controls",
      "industrial outage"
    ],
    "substitutes": [
      "US/EU suppliers where qualified"
    ],
    "monitorIndicators": [
      "METI",
      "company operations",
      "trade data"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-040",
    "origin": "East Asia",
    "destination": "Europe",
    "flow": "Container trade",
    "regions": [
      "strategic-asia",
      "middle-east",
      "europe"
    ],
    "strategicNodes": [
      "malacca",
      "bab-el-mandeb",
      "suez"
    ],
    "financialExposures": [
      "container"
    ],
    "failureModes": [
      "Red Sea attack",
      "Suez closure",
      "Malacca disruption"
    ],
    "substitutes": [
      "Cape of Good Hope",
      "air freight for high value"
    ],
    "monitorIndicators": [
      "carrier routing",
      "SCFI/FBX",
      "Suez transits"
    ],
    "typicalTransmissionLag": "hours-weeks"
  },
  {
    "id": "dep-041",
    "origin": "Persian Gulf",
    "destination": "Asia",
    "flow": "Energy shipping",
    "regions": [
      "middle-east",
      "strategic-asia"
    ],
    "strategicNodes": [
      "hormuz",
      "malacca"
    ],
    "financialExposures": [
      "brent",
      "tanker",
      "lng-eu"
    ],
    "failureModes": [
      "Hormuz disruption",
      "Malacca disruption"
    ],
    "substitutes": [
      "Lombok/Sunda for some Asia routing; no true Hormuz sea substitute"
    ],
    "monitorIndicators": [
      "tanker positions",
      "naval warnings",
      "freight"
    ],
    "typicalTransmissionLag": "hours-weeks"
  },
  {
    "id": "dep-042",
    "origin": "China/Taiwan/Japan/Korea",
    "destination": "US West Coast",
    "flow": "Container/electronics trade",
    "regions": [
      "strategic-asia",
      "north-america"
    ],
    "strategicNodes": [
      "taiwan-strait",
      "luzon",
      "la-longbeach"
    ],
    "financialExposures": [
      "container",
      "semis"
    ],
    "failureModes": [
      "Taiwan crisis",
      "West Coast strike",
      "typhoon"
    ],
    "substitutes": [
      "alternate US ports",
      "air freight",
      "inventory"
    ],
    "monitorIndicators": [
      "port dwell",
      "carrier blank sailings",
      "air freight rates"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-043",
    "origin": "Black Sea",
    "destination": "Mediterranean",
    "flow": "Energy/grain shipping",
    "regions": [
      "europe",
      "russia-eurasia"
    ],
    "strategicNodes": [
      "black-sea"
    ],
    "financialExposures": [
      "wheat",
      "brent",
      "tanker"
    ],
    "failureModes": [
      "war risk",
      "port closure",
      "Bosporus restriction"
    ],
    "substitutes": [
      "rail/river",
      "Baltic ports where feasible"
    ],
    "monitorIndicators": [
      "port loadings",
      "navigation warnings",
      "insurance"
    ],
    "typicalTransmissionLag": "hours-weeks"
  },
  {
    "id": "dep-044",
    "origin": "Baltic region",
    "destination": "North Sea/Europe",
    "flow": "Energy/container/security corridor",
    "regions": [
      "europe",
      "russia-eurasia"
    ],
    "strategicNodes": [
      "kaliningrad"
    ],
    "financialExposures": [
      "lng-eu",
      "defence-eu"
    ],
    "failureModes": [
      "cable sabotage",
      "GPS jamming",
      "port restriction"
    ],
    "substitutes": [
      "land routes",
      "alternative cables"
    ],
    "monitorIndicators": [
      "AIS anomalies",
      "network outages",
      "NATO alerts"
    ],
    "typicalTransmissionLag": "hours-weeks"
  },
  {
    "id": "dep-060",
    "origin": "Federal Reserve",
    "destination": "Global markets",
    "flow": "USD liquidity/rate setting",
    "regions": [
      "north-america",
      "world"
    ],
    "strategicNodes": [
      "ny-finance"
    ],
    "financialExposures": [
      "treasuries",
      "usd-index",
      "bitcoin",
      "gold",
      "eurusd",
      "usdjpy"
    ],
    "failureModes": [
      "policy surprise",
      "funding stress"
    ],
    "substitutes": [
      "other central-bank swap lines/liquidity"
    ],
    "monitorIndicators": [
      "FOMC",
      "SOFR/repo",
      "Treasury yields",
      "swap basis"
    ],
    "typicalTransmissionLag": "minutes-months"
  },
  {
    "id": "dep-061",
    "origin": "ECB",
    "destination": "Euro-area economy",
    "flow": "EUR rates/liquidity",
    "regions": [
      "europe"
    ],
    "strategicNodes": [
      "ny-finance"
    ],
    "financialExposures": [
      "eurusd",
      "eu-autos"
    ],
    "failureModes": [
      "policy surprise",
      "fragmentation",
      "bank stress"
    ],
    "substitutes": [
      "national fiscal policy has limited substitution"
    ],
    "monitorIndicators": [
      "OIS",
      "sovereign spreads",
      "bank funding"
    ],
    "typicalTransmissionLag": "minutes-months"
  },
  {
    "id": "dep-062",
    "origin": "Bank of Japan",
    "destination": "Global carry markets",
    "flow": "JPY rates/liquidity",
    "regions": [
      "strategic-asia",
      "world"
    ],
    "strategicNodes": [
      "ny-finance"
    ],
    "financialExposures": [
      "usdjpy",
      "nikkei",
      "treasuries"
    ],
    "failureModes": [
      "policy normalization shock",
      "intervention"
    ],
    "substitutes": [
      "hedging/deleveraging"
    ],
    "monitorIndicators": [
      "JGB yields",
      "JPY",
      "cross-asset volatility"
    ],
    "typicalTransmissionLag": "minutes-weeks"
  },
  {
    "id": "dep-063",
    "origin": "US Treasury/OFAC",
    "destination": "Global banks/shipping",
    "flow": "Dollar sanctions access",
    "regions": [
      "north-america",
      "middle-east",
      "russia-eurasia"
    ],
    "strategicNodes": [
      "washington"
    ],
    "financialExposures": [
      "brent",
      "tanker",
      "ruble"
    ],
    "failureModes": [
      "designation",
      "secondary sanctions"
    ],
    "substitutes": [
      "non-dollar channels with legal/operational limits"
    ],
    "monitorIndicators": [
      "designation lists",
      "bank exits",
      "shipping flags/insurance"
    ],
    "typicalTransmissionLag": "hours-months"
  },
  {
    "id": "dep-064",
    "origin": "US BIS",
    "destination": "Global semiconductor chain",
    "flow": "Technology export licensing",
    "regions": [
      "north-america",
      "strategic-asia",
      "europe"
    ],
    "strategicNodes": [
      "washington",
      "hsinchu"
    ],
    "financialExposures": [
      "semis"
    ],
    "failureModes": [
      "new control",
      "entity listing"
    ],
    "substitutes": [
      "redesign",
      "non-US content reduction",
      "local tools"
    ],
    "monitorIndicators": [
      "rule text",
      "license policy",
      "company guidance"
    ],
    "typicalTransmissionLag": "days-years"
  },
  {
    "id": "dep-065",
    "origin": "EU Council/Commission",
    "destination": "Russia/EU trade",
    "flow": "Sanctions and trade law",
    "regions": [
      "europe",
      "russia-eurasia"
    ],
    "strategicNodes": [
      "rotterdam"
    ],
    "financialExposures": [
      "brent",
      "lng-eu",
      "eu-autos"
    ],
    "failureModes": [
      "sanctions package",
      "tariff",
      "trade defence"
    ],
    "substitutes": [
      "third-country routing subject to enforcement"
    ],
    "monitorIndicators": [
      "Official Journal",
      "Council decisions",
      "customs guidance"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-080",
    "origin": "United States",
    "destination": "Middle East allies/bases",
    "flow": "Security guarantee and force projection",
    "regions": [
      "north-america",
      "middle-east"
    ],
    "strategicNodes": [
      "al-udeid",
      "incirlik"
    ],
    "financialExposures": [
      "brent",
      "gold"
    ],
    "failureModes": [
      "base attack",
      "force withdrawal",
      "direct war"
    ],
    "substitutes": [
      "regional forces/other allies limited substitute"
    ],
    "monitorIndicators": [
      "CENTCOM deployments",
      "embassy posture",
      "air defence"
    ],
    "typicalTransmissionLag": "hours-months"
  },
  {
    "id": "dep-081",
    "origin": "NATO",
    "destination": "Eastern Europe",
    "flow": "Collective defence posture",
    "regions": [
      "europe",
      "russia-eurasia"
    ],
    "strategicNodes": [
      "suwalki",
      "kaliningrad"
    ],
    "financialExposures": [
      "defence-eu"
    ],
    "failureModes": [
      "border attack",
      "alliance political fracture"
    ],
    "substitutes": [
      "national forces with reduced coordination"
    ],
    "monitorIndicators": [
      "Article 4/5 language",
      "reinforcement",
      "exercises"
    ],
    "typicalTransmissionLag": "hours-years"
  },
  {
    "id": "dep-082",
    "origin": "US/Japan alliance",
    "destination": "Western Pacific",
    "flow": "Regional deterrence/logistics",
    "regions": [
      "north-america",
      "strategic-asia"
    ],
    "strategicNodes": [
      "okinawa",
      "yokosuka"
    ],
    "financialExposures": [
      "semis",
      "nikkei"
    ],
    "failureModes": [
      "Taiwan conflict",
      "base attack"
    ],
    "substitutes": [
      "distributed regional bases"
    ],
    "monitorIndicators": [
      "US/Japan deployments",
      "base posture",
      "evacuation"
    ],
    "typicalTransmissionLag": "hours-months"
  },
  {
    "id": "dep-083",
    "origin": "US/ROK alliance",
    "destination": "Korean Peninsula",
    "flow": "Deterrence and reinforcement",
    "regions": [
      "north-america",
      "strategic-asia"
    ],
    "strategicNodes": [
      "pyeongtaek",
      "dmz"
    ],
    "financialExposures": [
      "kospi",
      "usdjpy"
    ],
    "failureModes": [
      "North Korean attack",
      "alliance rupture"
    ],
    "substitutes": [
      "ROK national capacity with reduced US support"
    ],
    "monitorIndicators": [
      "readiness changes",
      "exercises",
      "evacuations"
    ],
    "typicalTransmissionLag": "hours-months"
  },
  {
    "id": "dep-100",
    "origin": "China",
    "destination": "European Union",
    "flow": "Manufactured goods",
    "regions": [
      "strategic-asia",
      "europe"
    ],
    "strategicNodes": [],
    "financialExposures": [
      "container",
      "eu-autos"
    ],
    "failureModes": [
      "tariffs",
      "port disruption",
      "trade controls"
    ],
    "substitutes": [
      "Vietnam/India/Mexico re-sourcing"
    ],
    "monitorIndicators": [
      "official trade data",
      "operator status",
      "freight/pricing",
      "policy releases"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-101",
    "origin": "China",
    "destination": "United States",
    "flow": "Electronics/machinery",
    "regions": [
      "strategic-asia",
      "north-america"
    ],
    "strategicNodes": [],
    "financialExposures": [
      "container",
      "semis"
    ],
    "failureModes": [
      "tariffs",
      "export controls",
      "Taiwan crisis"
    ],
    "substitutes": [
      "Mexico/ASEAN re-sourcing"
    ],
    "monitorIndicators": [
      "official trade data",
      "operator status",
      "freight/pricing",
      "policy releases"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-102",
    "origin": "European Union",
    "destination": "United States",
    "flow": "Industrial goods/services",
    "regions": [
      "europe",
      "north-america"
    ],
    "strategicNodes": [],
    "financialExposures": [
      "eurusd",
      "eu-autos"
    ],
    "failureModes": [
      "tariffs",
      "regulatory conflict"
    ],
    "substitutes": [
      "domestic substitution",
      "third-country sourcing"
    ],
    "monitorIndicators": [
      "official trade data",
      "operator status",
      "freight/pricing",
      "policy releases"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-103",
    "origin": "Japan",
    "destination": "United States",
    "flow": "Autos/electronics",
    "regions": [
      "strategic-asia",
      "north-america"
    ],
    "strategicNodes": [],
    "financialExposures": [
      "nikkei",
      "usdjpy"
    ],
    "failureModes": [
      "tariffs",
      "shipping disruption"
    ],
    "substitutes": [
      "Mexico/US production"
    ],
    "monitorIndicators": [
      "official trade data",
      "operator status",
      "freight/pricing",
      "policy releases"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-104",
    "origin": "South Korea",
    "destination": "United States",
    "flow": "Semiconductors/autos/batteries",
    "regions": [
      "strategic-asia",
      "north-america"
    ],
    "strategicNodes": [],
    "financialExposures": [
      "kospi",
      "semis"
    ],
    "failureModes": [
      "tariffs",
      "Korean conflict"
    ],
    "substitutes": [
      "US/Japan/Taiwan capacity"
    ],
    "monitorIndicators": [
      "official trade data",
      "operator status",
      "freight/pricing",
      "policy releases"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-105",
    "origin": "India",
    "destination": "Middle East",
    "flow": "Energy/remittances/shipping",
    "regions": [
      "strategic-asia",
      "middle-east"
    ],
    "strategicNodes": [],
    "financialExposures": [
      "brent",
      "tanker"
    ],
    "failureModes": [
      "Hormuz disruption",
      "Gulf conflict"
    ],
    "substitutes": [
      "Russia/US/Africa crude"
    ],
    "monitorIndicators": [
      "official trade data",
      "operator status",
      "freight/pricing",
      "policy releases"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-106",
    "origin": "Europe",
    "destination": "Middle East",
    "flow": "Energy and aviation corridor",
    "regions": [
      "europe",
      "middle-east"
    ],
    "strategicNodes": [],
    "financialExposures": [
      "lng-eu",
      "airlines"
    ],
    "failureModes": [
      "Gulf war",
      "Suez/airspace closure"
    ],
    "substitutes": [
      "US LNG",
      "Cape routes"
    ],
    "monitorIndicators": [
      "official trade data",
      "operator status",
      "freight/pricing",
      "policy releases"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-107",
    "origin": "Russia",
    "destination": "China",
    "flow": "Energy/commodities",
    "regions": [
      "russia-eurasia",
      "strategic-asia"
    ],
    "strategicNodes": [],
    "financialExposures": [
      "brent",
      "ruble"
    ],
    "failureModes": [
      "secondary sanctions",
      "pipeline outage"
    ],
    "substitutes": [
      "seaborne alternatives",
      "other producers"
    ],
    "monitorIndicators": [
      "official trade data",
      "operator status",
      "freight/pricing",
      "policy releases"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-108",
    "origin": "Kazakhstan",
    "destination": "Europe",
    "flow": "Crude/uranium",
    "regions": [
      "russia-eurasia",
      "europe"
    ],
    "strategicNodes": [],
    "financialExposures": [
      "brent"
    ],
    "failureModes": [
      "CPC outage",
      "Russia transit restrictions"
    ],
    "substitutes": [
      "Caspian/trans-Caspian routes limited"
    ],
    "monitorIndicators": [
      "official trade data",
      "operator status",
      "freight/pricing",
      "policy releases"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-109",
    "origin": "Taiwan",
    "destination": "China",
    "flow": "Cross-strait trade",
    "regions": [
      "strategic-asia",
      "strategic-asia"
    ],
    "strategicNodes": [],
    "financialExposures": [
      "taiwan-eq",
      "semis"
    ],
    "failureModes": [
      "blockade",
      "sanctions",
      "customs restriction"
    ],
    "substitutes": [
      "third-market rerouting limited"
    ],
    "monitorIndicators": [
      "official trade data",
      "operator status",
      "freight/pricing",
      "policy releases"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-110",
    "origin": "South Korea",
    "destination": "China",
    "flow": "Components/consumer trade",
    "regions": [
      "strategic-asia",
      "strategic-asia"
    ],
    "strategicNodes": [],
    "financialExposures": [
      "kospi"
    ],
    "failureModes": [
      "trade retaliation",
      "regional conflict"
    ],
    "substitutes": [
      "ASEAN/US diversification"
    ],
    "monitorIndicators": [
      "official trade data",
      "operator status",
      "freight/pricing",
      "policy releases"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-111",
    "origin": "Japan",
    "destination": "China",
    "flow": "Industrial components",
    "regions": [
      "strategic-asia",
      "strategic-asia"
    ],
    "strategicNodes": [],
    "financialExposures": [
      "nikkei"
    ],
    "failureModes": [
      "export controls",
      "maritime confrontation"
    ],
    "substitutes": [
      "ASEAN supply chains"
    ],
    "monitorIndicators": [
      "official trade data",
      "operator status",
      "freight/pricing",
      "policy releases"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-112",
    "origin": "Singapore",
    "destination": "Global",
    "flow": "Transshipment/bunkering/finance",
    "regions": [
      "strategic-asia",
      "world"
    ],
    "strategicNodes": [],
    "financialExposures": [
      "container",
      "tanker"
    ],
    "failureModes": [
      "Malacca disruption",
      "port cyberattack"
    ],
    "substitutes": [
      "Malaysia/Indonesia ports limited"
    ],
    "monitorIndicators": [
      "official trade data",
      "operator status",
      "freight/pricing",
      "policy releases"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-113",
    "origin": "Turkey",
    "destination": "Europe/Middle East",
    "flow": "Bosporus/trade/energy bridge",
    "regions": [
      "middle-east",
      "europe"
    ],
    "strategicNodes": [],
    "financialExposures": [
      "wheat",
      "brent"
    ],
    "failureModes": [
      "Bosporus restriction",
      "political crisis"
    ],
    "substitutes": [
      "land routes/alternative sea routes"
    ],
    "monitorIndicators": [
      "official trade data",
      "operator status",
      "freight/pricing",
      "policy releases"
    ],
    "typicalTransmissionLag": "days-months"
  },
  {
    "id": "dep-114",
    "origin": "Norway",
    "destination": "European Union",
    "flow": "Pipeline gas",
    "regions": [
      "europe",
      "europe"
    ],
    "strategicNodes": [],
    "financialExposures": [
      "lng-eu"
    ],
    "failureModes": [
      "offshore outage",
      "pipeline sabotage"
    ],
    "substitutes": [
      "LNG",
      "storage"
    ],
    "monitorIndicators": [
      "official trade data",
      "operator status",
      "freight/pricing",
      "policy releases"
    ],
    "typicalTransmissionLag": "days-months"
  }
]);
