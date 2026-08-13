export const TRANSMISSION_RULES = Object.freeze([
  {
    "id": "tx-01",
    "name": "Hormuz escalation",
    "terms": [
      "hormuz",
      "iran",
      "strait",
      "gulf",
      "attack"
    ],
    "regions": [
      "middle-east"
    ],
    "assetImpacts": [
      "Brent",
      "WTI",
      "LNG",
      "gold"
    ],
    "potentialBeneficiaries": [
      "tanker rates",
      "war-risk insurance",
      "Gulf energy"
    ],
    "potentialLosers": [
      "airlines",
      "fuel-intensive transport"
    ],
    "baseConfidence": 0.98,
    "horizon": "hours-days",
    "rationale": "Any credible threat to passage through Hormuz can rapidly reprice energy and freight risk."
  },
  {
    "id": "tx-02",
    "name": "Red Sea disruption",
    "terms": [
      "red sea",
      "bab el-mandeb",
      "houthi",
      "shipping attack"
    ],
    "regions": [
      "middle-east"
    ],
    "assetImpacts": [
      "Brent"
    ],
    "potentialBeneficiaries": [
      "container shipping",
      "tanker rates",
      "insurance"
    ],
    "potentialLosers": [
      "European importers",
      "retailers with long Asia lead times"
    ],
    "baseConfidence": 0.95,
    "horizon": "hours-weeks",
    "rationale": "Diversions around the Cape increase distance, vessel demand and delivery times."
  },
  {
    "id": "tx-03",
    "name": "Suez restriction",
    "terms": [
      "suez",
      "canal closure",
      "canal traffic"
    ],
    "regions": [
      "middle-east",
      "europe"
    ],
    "assetImpacts": [],
    "potentialBeneficiaries": [
      "container shipping",
      "tanker rates"
    ],
    "potentialLosers": [
      "European importers",
      "time-sensitive supply chains"
    ],
    "baseConfidence": 0.96,
    "horizon": "hours-weeks",
    "rationale": "Suez disruption directly affects Asia-Europe route economics."
  },
  {
    "id": "tx-04",
    "name": "Iran sanctions tightening",
    "terms": [
      "iran",
      "sanctions",
      "ofac",
      "oil exports"
    ],
    "regions": [
      "middle-east",
      "north-america"
    ],
    "assetImpacts": [
      "Brent",
      "USD"
    ],
    "potentialBeneficiaries": [
      "non-Iranian oil exporters",
      "compliance services"
    ],
    "potentialLosers": [
      "Iran-linked shipping and counterparties"
    ],
    "baseConfidence": 0.92,
    "horizon": "days-months",
    "rationale": "Enforcement changes effective export supply and payment risk."
  },
  {
    "id": "tx-05",
    "name": "Iran-US de-escalation",
    "terms": [
      "iran",
      "united states",
      "ceasefire",
      "talks",
      "agreement",
      "nuclear deal"
    ],
    "regions": [
      "middle-east",
      "north-america"
    ],
    "assetImpacts": [],
    "potentialBeneficiaries": [
      "regional airlines",
      "Gulf tourism",
      "risk assets"
    ],
    "potentialLosers": [
      "oil risk premium",
      "war-risk insurance"
    ],
    "baseConfidence": 0.85,
    "horizon": "days-months",
    "rationale": "Credible de-escalation can compress geopolitical risk premia."
  },
  {
    "id": "tx-06",
    "name": "Israel-Iran direct escalation",
    "terms": [
      "israel",
      "iran",
      "missile",
      "airstrike",
      "retaliation"
    ],
    "regions": [
      "middle-east"
    ],
    "assetImpacts": [
      "Brent",
      "gold",
      "USD"
    ],
    "potentialBeneficiaries": [
      "defence",
      "tanker rates",
      "security"
    ],
    "potentialLosers": [
      "regional airlines",
      "tourism"
    ],
    "baseConfidence": 0.97,
    "horizon": "hours-days",
    "rationale": "Direct state-to-state escalation raises regional energy, aviation and shipping risk."
  },
  {
    "id": "tx-07",
    "name": "Ukraine escalation",
    "terms": [
      "ukraine",
      "russia",
      "missile",
      "offensive",
      "mobilisation"
    ],
    "regions": [
      "europe",
      "russia-eurasia"
    ],
    "assetImpacts": [
      "European gas",
      "wheat",
      "gold"
    ],
    "potentialBeneficiaries": [
      "defence",
      "security"
    ],
    "potentialLosers": [
      "European cyclicals",
      "Black Sea shipping"
    ],
    "baseConfidence": 0.9,
    "horizon": "hours-weeks",
    "rationale": "Escalation affects defence spending, energy risk and Black Sea trade."
  },
  {
    "id": "tx-08",
    "name": "Russia sanctions tightening",
    "terms": [
      "russia",
      "sanctions",
      "secondary sanctions",
      "oil price cap"
    ],
    "regions": [
      "europe",
      "russia-eurasia",
      "north-america"
    ],
    "assetImpacts": [
      "Brent"
    ],
    "potentialBeneficiaries": [
      "compliance",
      "alternative energy suppliers"
    ],
    "potentialLosers": [
      "Russia-linked shipping",
      "metals trade"
    ],
    "baseConfidence": 0.91,
    "horizon": "days-months",
    "rationale": "Sanctions can redirect commodity flows and settlement channels."
  },
  {
    "id": "tx-09",
    "name": "Russian energy infrastructure disruption",
    "terms": [
      "russia",
      "pipeline",
      "refinery",
      "terminal",
      "attack"
    ],
    "regions": [
      "russia-eurasia",
      "europe"
    ],
    "assetImpacts": [
      "Brent",
      "European gas"
    ],
    "potentialBeneficiaries": [
      "alternative suppliers",
      "tanker demand"
    ],
    "potentialLosers": [
      "affected refiners",
      "regional logistics"
    ],
    "baseConfidence": 0.93,
    "horizon": "hours-weeks",
    "rationale": "Physical export disruption can affect globally traded energy balances."
  },
  {
    "id": "tx-10",
    "name": "ECB surprise tightening",
    "terms": [
      "ecb",
      "rate hike",
      "hawkish",
      "inflation"
    ],
    "regions": [
      "europe"
    ],
    "assetImpacts": [
      "EUR",
      "European yields"
    ],
    "potentialBeneficiaries": [
      "banks"
    ],
    "potentialLosers": [
      "rate-sensitive equities",
      "property"
    ],
    "baseConfidence": 0.84,
    "horizon": "hours-months",
    "rationale": "Unexpectedly tighter monetary policy changes EUR rates and financial conditions."
  },
  {
    "id": "tx-11",
    "name": "ECB easing",
    "terms": [
      "ecb",
      "rate cut",
      "dovish"
    ],
    "regions": [
      "europe"
    ],
    "assetImpacts": [
      "European equities"
    ],
    "potentialBeneficiaries": [
      "rate-sensitive sectors"
    ],
    "potentialLosers": [
      "EUR carry"
    ],
    "baseConfidence": 0.82,
    "horizon": "hours-months",
    "rationale": "Easing can support credit-sensitive activity while altering currency differentials."
  },
  {
    "id": "tx-12",
    "name": "Federal Reserve tightening",
    "terms": [
      "federal reserve",
      "rate hike",
      "hawkish",
      "inflation"
    ],
    "regions": [
      "north-america"
    ],
    "assetImpacts": [
      "USD",
      "Treasury yields"
    ],
    "potentialBeneficiaries": [
      "cash-rich financials"
    ],
    "potentialLosers": [
      "long-duration growth",
      "emerging-market FX"
    ],
    "baseConfidence": 0.9,
    "horizon": "hours-months",
    "rationale": "US rates transmit globally through the dollar and discount rates."
  },
  {
    "id": "tx-13",
    "name": "Federal Reserve easing",
    "terms": [
      "federal reserve",
      "rate cut",
      "dovish"
    ],
    "regions": [
      "north-america"
    ],
    "assetImpacts": [
      "Treasuries",
      "growth equities",
      "gold"
    ],
    "potentialBeneficiaries": [
      "rate-sensitive sectors"
    ],
    "potentialLosers": [
      "USD carry"
    ],
    "baseConfidence": 0.88,
    "horizon": "hours-months",
    "rationale": "Easing alters global liquidity and risk pricing."
  },
  {
    "id": "tx-14",
    "name": "US tariff escalation",
    "terms": [
      "tariff",
      "united states",
      "import duty",
      "trade war"
    ],
    "regions": [
      "north-america",
      "strategic-asia",
      "europe"
    ],
    "assetImpacts": [
      "USD"
    ],
    "potentialBeneficiaries": [
      "domestic substitutes",
      "trade compliance"
    ],
    "potentialLosers": [
      "targeted exporters",
      "import-dependent manufacturers"
    ],
    "baseConfidence": 0.88,
    "horizon": "days-months",
    "rationale": "Tariffs change landed costs, demand and supply-chain location incentives."
  },
  {
    "id": "tx-15",
    "name": "Advanced chip export controls",
    "terms": [
      "export control",
      "semiconductor",
      "china",
      "advanced chip",
      "ai chip",
      "lithography"
    ],
    "regions": [
      "north-america",
      "strategic-asia",
      "europe"
    ],
    "assetImpacts": [],
    "potentialBeneficiaries": [
      "compliance",
      "domestic semiconductor capacity"
    ],
    "potentialLosers": [
      "restricted chip vendors",
      "affected Chinese buyers"
    ],
    "baseConfidence": 0.94,
    "horizon": "days-years",
    "rationale": "Controls on advanced compute and tooling can reshape semiconductor demand and capex."
  },
  {
    "id": "tx-16",
    "name": "Taiwan military escalation",
    "terms": [
      "taiwan",
      "pla",
      "blockade",
      "exercise",
      "missile",
      "strait"
    ],
    "regions": [
      "strategic-asia"
    ],
    "assetImpacts": [
      "gold",
      "USD"
    ],
    "potentialBeneficiaries": [
      "defence",
      "alternative fabs",
      "shipping"
    ],
    "potentialLosers": [
      "semiconductors",
      "electronics supply chains",
      "regional airlines"
    ],
    "baseConfidence": 0.99,
    "horizon": "hours-weeks",
    "rationale": "Taiwan disruption is a high-impact global semiconductor and shipping risk."
  },
  {
    "id": "tx-17",
    "name": "Taiwan de-escalation",
    "terms": [
      "taiwan",
      "china",
      "talks",
      "de-escalation",
      "dialogue"
    ],
    "regions": [
      "strategic-asia"
    ],
    "assetImpacts": [],
    "potentialBeneficiaries": [
      "regional risk assets",
      "airlines"
    ],
    "potentialLosers": [
      "geopolitical hedges"
    ],
    "baseConfidence": 0.72,
    "horizon": "days-weeks",
    "rationale": "Credible de-escalation reduces tail-risk premia but must be corroborated."
  },
  {
    "id": "tx-18",
    "name": "North Korea escalation",
    "terms": [
      "north korea",
      "missile",
      "nuclear test",
      "artillery",
      "dmz"
    ],
    "regions": [
      "strategic-asia"
    ],
    "assetImpacts": [
      "gold",
      "USD"
    ],
    "potentialBeneficiaries": [
      "defence"
    ],
    "potentialLosers": [
      "KRW",
      "Korean equities",
      "regional travel"
    ],
    "baseConfidence": 0.91,
    "horizon": "hours-days",
    "rationale": "Missile or nuclear escalation can rapidly change regional risk appetite."
  },
  {
    "id": "tx-19",
    "name": "Japan monetary tightening",
    "terms": [
      "bank of japan",
      "boj",
      "rate hike",
      "yield curve"
    ],
    "regions": [
      "strategic-asia"
    ],
    "assetImpacts": [
      "JPY",
      "Japanese yields"
    ],
    "potentialBeneficiaries": [
      "Japanese banks"
    ],
    "potentialLosers": [
      "yen-funded carry trades"
    ],
    "baseConfidence": 0.86,
    "horizon": "hours-months",
    "rationale": "BOJ shifts can unwind leveraged global carry positions."
  },
  {
    "id": "tx-20",
    "name": "China stimulus",
    "terms": [
      "china",
      "stimulus",
      "reserve requirement",
      "property support",
      "fiscal support"
    ],
    "regions": [
      "strategic-asia"
    ],
    "assetImpacts": [
      "copper",
      "iron ore"
    ],
    "potentialBeneficiaries": [
      "Asian exporters",
      "miners",
      "industrial cyclicals"
    ],
    "potentialLosers": [],
    "baseConfidence": 0.82,
    "horizon": "days-months",
    "rationale": "Large Chinese stimulus can lift commodity and regional demand expectations."
  },
  {
    "id": "tx-21",
    "name": "China property stress",
    "terms": [
      "china",
      "developer default",
      "property crisis",
      "home sales"
    ],
    "regions": [
      "strategic-asia"
    ],
    "assetImpacts": [],
    "potentialBeneficiaries": [
      "defensive assets"
    ],
    "potentialLosers": [
      "iron ore",
      "construction materials",
      "China cyclicals"
    ],
    "baseConfidence": 0.82,
    "horizon": "days-months",
    "rationale": "Property weakness affects Chinese credit, commodities and household demand."
  },
  {
    "id": "tx-22",
    "name": "South China Sea confrontation",
    "terms": [
      "south china sea",
      "philippines",
      "china",
      "collision",
      "water cannon",
      "shoal"
    ],
    "regions": [
      "strategic-asia"
    ],
    "assetImpacts": [],
    "potentialBeneficiaries": [
      "defence",
      "maritime surveillance"
    ],
    "potentialLosers": [
      "regional shipping risk"
    ],
    "baseConfidence": 0.86,
    "horizon": "hours-weeks",
    "rationale": "Repeated confrontations can affect alliance posture and shipping risk."
  },
  {
    "id": "tx-23",
    "name": "Malacca disruption",
    "terms": [
      "malacca",
      "port closure",
      "shipping accident",
      "blockage"
    ],
    "regions": [
      "strategic-asia"
    ],
    "assetImpacts": [
      "oil",
      "LNG"
    ],
    "potentialBeneficiaries": [
      "shipping",
      "alternative routes"
    ],
    "potentialLosers": [
      "Asian importers"
    ],
    "baseConfidence": 0.96,
    "horizon": "hours-weeks",
    "rationale": "Malacca is a core energy and container corridor for Asia."
  },
  {
    "id": "tx-24",
    "name": "Major cyber infrastructure attack",
    "terms": [
      "cyberattack",
      "critical infrastructure",
      "grid",
      "telecom",
      "port system"
    ],
    "regions": [
      "world"
    ],
    "assetImpacts": [
      "gold"
    ],
    "potentialBeneficiaries": [
      "cybersecurity",
      "resilience services"
    ],
    "potentialLosers": [
      "affected operators",
      "logistics"
    ],
    "baseConfidence": 0.86,
    "horizon": "hours-weeks",
    "rationale": "Operational cyber incidents can create real-world disruption and repricing."
  },
  {
    "id": "tx-25",
    "name": "Major port strike",
    "terms": [
      "port strike",
      "dockworker strike",
      "port closure",
      "labour dispute"
    ],
    "regions": [
      "world"
    ],
    "assetImpacts": [],
    "potentialBeneficiaries": [
      "alternative ports",
      "freight brokers"
    ],
    "potentialLosers": [
      "importers",
      "exporters",
      "retailers"
    ],
    "baseConfidence": 0.88,
    "horizon": "days-weeks",
    "rationale": "Port labour disruption can create short-term capacity and inventory dislocations."
  },
  {
    "id": "tx-26",
    "name": "Nuclear safeguards deterioration",
    "terms": [
      "iaea",
      "enrichment",
      "uranium",
      "centrifuge",
      "inspectors",
      "nuclear facility"
    ],
    "regions": [
      "middle-east"
    ],
    "assetImpacts": [
      "gold",
      "Brent"
    ],
    "potentialBeneficiaries": [
      "defence",
      "security"
    ],
    "potentialLosers": [
      "regional tourism",
      "risk assets"
    ],
    "baseConfidence": 0.91,
    "horizon": "days-months",
    "rationale": "Nuclear monitoring changes can alter escalation and sanctions expectations."
  },
  {
    "id": "tx-27",
    "name": "Sovereign default risk",
    "terms": [
      "default",
      "debt restructuring",
      "imf",
      "capital controls",
      "sovereign debt"
    ],
    "regions": [
      "world"
    ],
    "assetImpacts": [
      "USD",
      "gold"
    ],
    "potentialBeneficiaries": [
      "distressed debt services"
    ],
    "potentialLosers": [
      "local banks",
      "local currency"
    ],
    "baseConfidence": 0.87,
    "horizon": "days-months",
    "rationale": "Sovereign stress affects currencies, banks, imports and political stability."
  },
  {
    "id": "tx-28",
    "name": "Airspace closure",
    "terms": [
      "airspace closed",
      "flight suspension",
      "notam",
      "airline cancels"
    ],
    "regions": [
      "world"
    ],
    "assetImpacts": [
      "oil"
    ],
    "potentialBeneficiaries": [
      "alternative hubs"
    ],
    "potentialLosers": [
      "airlines",
      "tourism",
      "time-sensitive cargo"
    ],
    "baseConfidence": 0.86,
    "horizon": "hours-days",
    "rationale": "Airspace restrictions immediately affect routes, fuel burn and passenger/cargo capacity."
  },
  {
    "id": "tx-29",
    "name": "OPEC supply cut",
    "terms": [
      "opec",
      "production cut",
      "output cut",
      "quota"
    ],
    "regions": [
      "middle-east"
    ],
    "assetImpacts": [
      "Brent",
      "WTI"
    ],
    "potentialBeneficiaries": [
      "oil producers"
    ],
    "potentialLosers": [
      "fuel consumers",
      "airlines"
    ],
    "baseConfidence": 0.9,
    "horizon": "hours-months",
    "rationale": "OPEC supply policy directly changes expected oil balances."
  },
  {
    "id": "tx-30",
    "name": "LNG supply disruption",
    "terms": [
      "lng",
      "terminal outage",
      "liquefaction outage",
      "gas export"
    ],
    "regions": [
      "middle-east",
      "north-america",
      "europe",
      "strategic-asia"
    ],
    "assetImpacts": [
      "LNG",
      "European gas"
    ],
    "potentialBeneficiaries": [
      "alternative LNG suppliers",
      "shipping"
    ],
    "potentialLosers": [
      "gas-intensive industry"
    ],
    "baseConfidence": 0.9,
    "horizon": "hours-weeks",
    "rationale": "LNG outages can transmit across Europe and Asia through spot cargo competition."
  },
  {
    "id": "tx-31",
    "name": "Rare-earth export restriction",
    "terms": [
      "rare earth",
      "export ban",
      "gallium",
      "germanium",
      "graphite",
      "china"
    ],
    "regions": [
      "strategic-asia",
      "north-america",
      "europe"
    ],
    "assetImpacts": [],
    "potentialBeneficiaries": [
      "alternative miners",
      "recycling",
      "domestic processing"
    ],
    "potentialLosers": [
      "electronics",
      "defence supply chains"
    ],
    "baseConfidence": 0.92,
    "horizon": "days-months",
    "rationale": "Critical-mineral controls can affect technology and defence production."
  },
  {
    "id": "tx-32",
    "name": "Major earthquake industrial zone",
    "terms": [
      "earthquake",
      "factory",
      "port",
      "semiconductor"
    ],
    "regions": [
      "strategic-asia",
      "north-america",
      "europe"
    ],
    "assetImpacts": [],
    "potentialBeneficiaries": [
      "alternative suppliers",
      "construction"
    ],
    "potentialLosers": [
      "local manufacturing",
      "ports"
    ],
    "baseConfidence": 0.78,
    "horizon": "hours-weeks",
    "rationale": "Only material earthquakes with industrial or logistics impact should enter the decision feed."
  }
]);
