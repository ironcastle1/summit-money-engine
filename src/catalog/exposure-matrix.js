export const EXPOSURE_MATRIX = Object.freeze([
  {
    "id": "brent",
    "name": "Brent crude",
    "kind": "commodity",
    "regions": [
      "middle-east",
      "russia-eurasia",
      "europe"
    ],
    "symbols": [
      "BZ",
      "Brent"
    ],
    "drivers": [
      "Hormuz",
      "OPEC+",
      "Russia exports",
      "Red Sea",
      "global demand"
    ],
    "upsideConditions": [
      "physical supply loss",
      "shipping disruption",
      "production cuts"
    ],
    "downsideConditions": [
      "credible de-escalation",
      "supply restoration",
      "demand shock"
    ],
    "horizons": [
      "hours",
      "days",
      "months"
    ],
    "notes": "Watch prompt spreads and physical flows; headlines without flow impact can fade quickly."
  },
  {
    "id": "wti",
    "name": "WTI crude",
    "kind": "commodity",
    "regions": [
      "north-america",
      "middle-east"
    ],
    "symbols": [
      "CL",
      "WTI"
    ],
    "drivers": [
      "US inventories",
      "Gulf Coast",
      "OPEC+",
      "global risk"
    ],
    "upsideConditions": [
      "US outage",
      "global supply shock"
    ],
    "downsideConditions": [
      "inventory build",
      "demand slowdown"
    ],
    "horizons": [
      "hours",
      "days"
    ],
    "notes": "Cushing and Gulf Coast logistics can create divergence from Brent."
  },
  {
    "id": "gold",
    "name": "Gold",
    "kind": "commodity",
    "regions": [
      "world"
    ],
    "symbols": [
      "GC",
      "XAUUSD"
    ],
    "drivers": [
      "geopolitical risk",
      "real yields",
      "USD",
      "financial stress"
    ],
    "upsideConditions": [
      "acute risk aversion",
      "falling real yields",
      "systemic stress"
    ],
    "downsideConditions": [
      "rising real yields",
      "risk normalization"
    ],
    "horizons": [
      "hours",
      "weeks"
    ],
    "notes": "Gold is not a pure geopolitical hedge; real yields and USD can dominate."
  },
  {
    "id": "lng-eu",
    "name": "European natural gas",
    "kind": "commodity",
    "regions": [
      "europe",
      "middle-east",
      "russia-eurasia"
    ],
    "symbols": [
      "TTF"
    ],
    "drivers": [
      "Qatar LNG",
      "Norway",
      "Russia transit",
      "storage",
      "weather"
    ],
    "upsideConditions": [
      "LNG outage",
      "pipeline loss",
      "cold weather",
      "shipping disruption"
    ],
    "downsideConditions": [
      "high storage",
      "mild weather",
      "supply restoration"
    ],
    "horizons": [
      "hours",
      "months"
    ],
    "notes": "Assess storage season and substitute supply before extrapolating a headline."
  },
  {
    "id": "tanker",
    "name": "Crude tanker freight",
    "kind": "freight",
    "regions": [
      "middle-east",
      "strategic-asia",
      "europe"
    ],
    "symbols": [
      "VLCC",
      "Suezmax"
    ],
    "drivers": [
      "Hormuz",
      "sanctions fleet",
      "Red Sea",
      "ton-mile demand"
    ],
    "upsideConditions": [
      "rerouting",
      "war-risk",
      "vessel sanctions"
    ],
    "downsideConditions": [
      "route normalization",
      "fleet availability"
    ],
    "horizons": [
      "hours",
      "weeks"
    ],
    "notes": "Freight can benefit from longer routes even when cargo volume is unchanged."
  },
  {
    "id": "container",
    "name": "Container freight",
    "kind": "freight",
    "regions": [
      "strategic-asia",
      "middle-east",
      "europe",
      "north-america"
    ],
    "symbols": [
      "SCFI",
      "FBX"
    ],
    "drivers": [
      "Suez",
      "Red Sea",
      "port strikes",
      "tariffs",
      "seasonality"
    ],
    "upsideConditions": [
      "Cape rerouting",
      "port closure",
      "capacity withdrawal"
    ],
    "downsideConditions": [
      "Suez normalization",
      "weak demand",
      "excess capacity"
    ],
    "horizons": [
      "days",
      "months"
    ],
    "notes": "Different trade lanes respond differently; avoid treating one index as global freight."
  },
  {
    "id": "eurusd",
    "name": "EUR/USD",
    "kind": "fx",
    "regions": [
      "europe",
      "north-america"
    ],
    "symbols": [
      "EURUSD"
    ],
    "drivers": [
      "ECB",
      "Fed",
      "Europe growth",
      "energy shock",
      "risk"
    ],
    "upsideConditions": [
      "ECB hawkish surprise",
      "Fed dovish surprise",
      "Europe improvement"
    ],
    "downsideConditions": [
      "Europe energy shock",
      "ECB dovish surprise",
      "US yield advantage"
    ],
    "horizons": [
      "minutes",
      "months"
    ],
    "notes": "Rate differentials often overwhelm geopolitical narratives unless Europe is directly exposed."
  },
  {
    "id": "usdjpy",
    "name": "USD/JPY",
    "kind": "fx",
    "regions": [
      "strategic-asia",
      "north-america"
    ],
    "symbols": [
      "USDJPY"
    ],
    "drivers": [
      "BOJ",
      "Fed",
      "carry trades",
      "risk aversion"
    ],
    "upsideConditions": [
      "US yields rise",
      "BOJ stays loose"
    ],
    "downsideConditions": [
      "BOJ tightening",
      "carry unwind",
      "Japanese intervention"
    ],
    "horizons": [
      "minutes",
      "months"
    ],
    "notes": "Geopolitical risk can strengthen JPY in some regimes but policy divergence is critical."
  },
  {
    "id": "usdtwd",
    "name": "USD/TWD",
    "kind": "fx",
    "regions": [
      "strategic-asia"
    ],
    "symbols": [
      "USDTWD"
    ],
    "drivers": [
      "Taiwan risk",
      "capital flows",
      "semiconductors",
      "CBC intervention"
    ],
    "upsideConditions": [
      "Taiwan escalation",
      "foreign outflows"
    ],
    "downsideConditions": [
      "de-escalation",
      "tech inflows"
    ],
    "horizons": [
      "hours",
      "weeks"
    ],
    "notes": "Central-bank smoothing can obscure underlying pressure."
  },
  {
    "id": "kospi",
    "name": "Korean equities",
    "kind": "equity-index",
    "regions": [
      "strategic-asia"
    ],
    "symbols": [
      "KOSPI"
    ],
    "drivers": [
      "semiconductors",
      "China demand",
      "North Korea",
      "KRW"
    ],
    "upsideConditions": [
      "export recovery",
      "chip upcycle"
    ],
    "downsideConditions": [
      "peninsula escalation",
      "chip downturn",
      "China slowdown"
    ],
    "horizons": [
      "hours",
      "months"
    ],
    "notes": "Large exporters make global electronics demand important alongside local geopolitics."
  },
  {
    "id": "taiwan-eq",
    "name": "Taiwan equities",
    "kind": "equity-index",
    "regions": [
      "strategic-asia"
    ],
    "symbols": [
      "TAIEX"
    ],
    "drivers": [
      "TSMC",
      "AI chips",
      "China-Taiwan risk",
      "TWD"
    ],
    "upsideConditions": [
      "chip demand",
      "de-escalation"
    ],
    "downsideConditions": [
      "blockade risk",
      "fab disruption",
      "export controls"
    ],
    "horizons": [
      "hours",
      "months"
    ],
    "notes": "Index concentration in semiconductors amplifies technology-cycle effects."
  },
  {
    "id": "nikkei",
    "name": "Japanese equities",
    "kind": "equity-index",
    "regions": [
      "strategic-asia"
    ],
    "symbols": [
      "Nikkei 225"
    ],
    "drivers": [
      "JPY",
      "BOJ",
      "global manufacturing",
      "China"
    ],
    "upsideConditions": [
      "weaker JPY with stable rates",
      "export demand"
    ],
    "downsideConditions": [
      "carry unwind",
      "regional escalation",
      "sharp JPY appreciation"
    ],
    "horizons": [
      "hours",
      "months"
    ],
    "notes": "Currency sensitivity differs sharply by sector."
  },
  {
    "id": "semis",
    "name": "Advanced semiconductors",
    "kind": "sector",
    "regions": [
      "strategic-asia",
      "north-america",
      "europe"
    ],
    "symbols": [
      "SOX",
      "TSM",
      "NVDA",
      "ASML"
    ],
    "drivers": [
      "Taiwan",
      "export controls",
      "AI demand",
      "fab equipment"
    ],
    "upsideConditions": [
      "demand growth",
      "supply expansion",
      "de-escalation"
    ],
    "downsideConditions": [
      "Taiwan disruption",
      "equipment controls",
      "China retaliation"
    ],
    "horizons": [
      "hours",
      "years"
    ],
    "notes": "Separate demand-cycle effects from geopolitical supply risk."
  },
  {
    "id": "defence-eu",
    "name": "European defence",
    "kind": "sector",
    "regions": [
      "europe"
    ],
    "symbols": [
      "defence basket"
    ],
    "drivers": [
      "NATO spending",
      "Ukraine",
      "procurement"
    ],
    "upsideConditions": [
      "higher budgets",
      "rearmament orders"
    ],
    "downsideConditions": [
      "ceasefire plus spending reversal"
    ],
    "horizons": [
      "weeks",
      "years"
    ],
    "notes": "Budget commitments and contract awards are stronger signals than rhetoric."
  },
  {
    "id": "airlines",
    "name": "Airlines",
    "kind": "sector",
    "regions": [
      "world"
    ],
    "symbols": [
      "airline basket"
    ],
    "drivers": [
      "jet fuel",
      "airspace",
      "demand",
      "insurance"
    ],
    "upsideConditions": [
      "lower fuel",
      "airspace normalization"
    ],
    "downsideConditions": [
      "oil spike",
      "airspace closure",
      "war risk"
    ],
    "horizons": [
      "hours",
      "months"
    ],
    "notes": "Route closures can raise both fuel use and fleet scheduling costs."
  },
  {
    "id": "eu-autos",
    "name": "European autos",
    "kind": "sector",
    "regions": [
      "europe",
      "strategic-asia"
    ],
    "symbols": [
      "auto basket"
    ],
    "drivers": [
      "China demand",
      "tariffs",
      "energy",
      "EUR"
    ],
    "upsideConditions": [
      "trade relief",
      "China recovery"
    ],
    "downsideConditions": [
      "tariffs",
      "China retaliation",
      "energy shock"
    ],
    "horizons": [
      "days",
      "years"
    ],
    "notes": "Supply-chain and market-access effects can dominate short-term FX moves."
  },
  {
    "id": "rare-earths",
    "name": "Critical minerals",
    "kind": "commodity-sector",
    "regions": [
      "strategic-asia",
      "north-america",
      "europe"
    ],
    "symbols": [
      "rare earth basket"
    ],
    "drivers": [
      "China export controls",
      "defence demand",
      "mine supply"
    ],
    "upsideConditions": [
      "export restriction",
      "strategic stockpiling"
    ],
    "downsideConditions": [
      "new supply",
      "restriction relaxation"
    ],
    "horizons": [
      "days",
      "years"
    ],
    "notes": "Physical qualification and processing bottlenecks matter more than ore abundance."
  },
  {
    "id": "ruble",
    "name": "Russian rouble",
    "kind": "fx",
    "regions": [
      "russia-eurasia"
    ],
    "symbols": [
      "RUB"
    ],
    "drivers": [
      "oil receipts",
      "capital controls",
      "sanctions",
      "CBR"
    ],
    "upsideConditions": [
      "export receipts",
      "tight controls",
      "high rates"
    ],
    "downsideConditions": [
      "sanctions tightening",
      "import demand",
      "control relaxation"
    ],
    "horizons": [
      "hours",
      "months"
    ],
    "notes": "Official and offshore pricing can diverge under controls."
  },
  {
    "id": "wheat",
    "name": "Black Sea wheat",
    "kind": "commodity",
    "regions": [
      "europe",
      "russia-eurasia",
      "middle-east"
    ],
    "symbols": [
      "ZW",
      "Black Sea wheat"
    ],
    "drivers": [
      "Odesa",
      "Russia exports",
      "weather",
      "shipping"
    ],
    "upsideConditions": [
      "port disruption",
      "export restriction",
      "crop loss"
    ],
    "downsideConditions": [
      "strong harvest",
      "route normalization"
    ],
    "horizons": [
      "days",
      "months"
    ],
    "notes": "Import-dependent Middle Eastern states are especially sensitive to sustained price spikes."
  },
  {
    "id": "aluminium",
    "name": "Aluminium",
    "kind": "commodity",
    "regions": [
      "russia-eurasia",
      "europe",
      "strategic-asia"
    ],
    "symbols": [
      "ALI"
    ],
    "drivers": [
      "Russia sanctions",
      "China output",
      "power costs"
    ],
    "upsideConditions": [
      "sanctions on supply",
      "power curtailment"
    ],
    "downsideConditions": [
      "China output growth",
      "weak demand"
    ],
    "horizons": [
      "days",
      "months"
    ],
    "notes": "Exchange deliverability and sanctions rules can matter as much as physical production."
  },
  {
    "id": "palladium",
    "name": "Palladium",
    "kind": "commodity",
    "regions": [
      "russia-eurasia",
      "europe"
    ],
    "symbols": [
      "PA"
    ],
    "drivers": [
      "Russia supply",
      "auto catalysts",
      "substitution"
    ],
    "upsideConditions": [
      "supply sanctions",
      "mine disruption"
    ],
    "downsideConditions": [
      "EV penetration",
      "platinum substitution"
    ],
    "horizons": [
      "days",
      "years"
    ],
    "notes": "Structural demand changes can offset geopolitical supply shocks."
  },
  {
    "id": "bitcoin",
    "name": "Bitcoin",
    "kind": "crypto",
    "regions": [
      "world"
    ],
    "symbols": [
      "BTCUSD"
    ],
    "drivers": [
      "liquidity",
      "risk appetite",
      "regulation",
      "flows"
    ],
    "upsideConditions": [
      "liquidity easing",
      "strong inflows"
    ],
    "downsideConditions": [
      "liquidity tightening",
      "risk-off",
      "regulatory shock"
    ],
    "horizons": [
      "minutes",
      "months"
    ],
    "notes": "Treat crypto as a high-volatility liquidity asset, not a reliable war hedge."
  },
  {
    "id": "usd-index",
    "name": "US dollar",
    "kind": "fx",
    "regions": [
      "world"
    ],
    "symbols": [
      "DXY"
    ],
    "drivers": [
      "Fed",
      "risk aversion",
      "US growth",
      "funding stress"
    ],
    "upsideConditions": [
      "risk-off dollar demand",
      "hawkish Fed"
    ],
    "downsideConditions": [
      "Fed easing",
      "global recovery"
    ],
    "horizons": [
      "minutes",
      "months"
    ],
    "notes": "Dollar funding stress can strengthen USD even when the shock originates in the US."
  },
  {
    "id": "treasuries",
    "name": "US Treasuries",
    "kind": "rates",
    "regions": [
      "north-america",
      "world"
    ],
    "symbols": [
      "UST 2Y",
      "UST 10Y"
    ],
    "drivers": [
      "Fed",
      "inflation",
      "risk-off",
      "fiscal issuance"
    ],
    "upsideConditions": [
      "growth scare for bond prices",
      "safe-haven demand"
    ],
    "downsideConditions": [
      "inflation shock",
      "fiscal term premium"
    ],
    "horizons": [
      "minutes",
      "years"
    ],
    "notes": "Geopolitical shocks can lower yields initially but oil-driven inflation can reverse the move."
  }
]);
