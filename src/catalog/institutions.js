export const INSTITUTIONS = Object.freeze([
  {
    "id": "fed",
    "name": "Federal Reserve",
    "regionId": "north-america",
    "countryCode": "US",
    "kind": "central-bank",
    "priority": 100,
    "aliases": [
      "Federal Reserve",
      "Fed",
      "FOMC"
    ],
    "topics": [
      "macro",
      "rates",
      "financial-stability"
    ],
    "whyItMatters": "US monetary policy transmits globally through rates, USD liquidity and risk appetite.",
    "highValueSignals": [
      "rate decision",
      "dot plot",
      "balance sheet",
      "emergency facility",
      "inflation assessment"
    ]
  },
  {
    "id": "ust",
    "name": "US Treasury",
    "regionId": "north-america",
    "countryCode": "US",
    "kind": "finance-ministry",
    "priority": 99,
    "aliases": [
      "US Treasury",
      "Treasury Department"
    ],
    "topics": [
      "sanctions",
      "fiscal",
      "financial-stability"
    ],
    "whyItMatters": "Treasury actions can change sanctions, debt issuance and global dollar funding conditions.",
    "highValueSignals": [
      "sanctions",
      "debt issuance",
      "financial stability",
      "currency policy"
    ]
  },
  {
    "id": "ofac",
    "name": "Office of Foreign Assets Control",
    "regionId": "north-america",
    "countryCode": "US",
    "kind": "sanctions-authority",
    "priority": 100,
    "aliases": [
      "OFAC",
      "Office of Foreign Assets Control"
    ],
    "topics": [
      "sanctions",
      "shipping",
      "energy",
      "finance"
    ],
    "whyItMatters": "OFAC designations can abruptly change legal counterparty, shipping and payment risk.",
    "highValueSignals": [
      "designation",
      "general license",
      "secondary sanctions",
      "enforcement action"
    ]
  },
  {
    "id": "state",
    "name": "US Department of State",
    "regionId": "north-america",
    "countryCode": "US",
    "kind": "foreign-ministry",
    "priority": 96,
    "aliases": [
      "State Department",
      "US State Department"
    ],
    "topics": [
      "diplomacy",
      "sanctions",
      "conflict"
    ],
    "whyItMatters": "State Department positions often precede or explain changes in diplomacy, sanctions and security posture.",
    "highValueSignals": [
      "travel warning",
      "diplomatic talks",
      "sanctions policy",
      "security assistance"
    ]
  },
  {
    "id": "dod",
    "name": "US Department of Defense",
    "regionId": "north-america",
    "countryCode": "US",
    "kind": "defence-ministry",
    "priority": 98,
    "aliases": [
      "Pentagon",
      "Department of Defense",
      "US Defense Department"
    ],
    "topics": [
      "conflict",
      "military",
      "security"
    ],
    "whyItMatters": "Force posture and deployment announcements can materially change escalation probabilities.",
    "highValueSignals": [
      "deployment",
      "carrier strike group",
      "force protection",
      "military operation"
    ]
  },
  {
    "id": "centcom",
    "name": "US Central Command",
    "regionId": "middle-east",
    "countryCode": "US",
    "kind": "military-command",
    "priority": 99,
    "aliases": [
      "CENTCOM",
      "US Central Command"
    ],
    "topics": [
      "conflict",
      "shipping",
      "security"
    ],
    "whyItMatters": "CENTCOM operational statements are primary evidence for US military activity across the Middle East.",
    "highValueSignals": [
      "strike",
      "intercept",
      "deployment",
      "maritime security"
    ]
  },
  {
    "id": "bis",
    "name": "Bureau of Industry and Security",
    "regionId": "north-america",
    "countryCode": "US",
    "kind": "export-control",
    "priority": 98,
    "aliases": [
      "BIS",
      "Bureau of Industry and Security"
    ],
    "topics": [
      "policy",
      "semiconductors",
      "trade"
    ],
    "whyItMatters": "BIS export controls directly affect advanced chips, equipment and strategic technology supply chains.",
    "highValueSignals": [
      "entity list",
      "export control",
      "license requirement",
      "advanced computing"
    ]
  },
  {
    "id": "ustr",
    "name": "US Trade Representative",
    "regionId": "north-america",
    "countryCode": "US",
    "kind": "trade-authority",
    "priority": 93,
    "aliases": [
      "USTR",
      "US Trade Representative"
    ],
    "topics": [
      "trade",
      "tariffs",
      "policy"
    ],
    "whyItMatters": "USTR decisions can alter tariff exposure, sourcing economics and retaliation risk.",
    "highValueSignals": [
      "tariff",
      "Section 301",
      "trade action",
      "investigation"
    ]
  },
  {
    "id": "doe",
    "name": "US Department of Energy",
    "regionId": "north-america",
    "countryCode": "US",
    "kind": "energy-ministry",
    "priority": 91,
    "aliases": [
      "Department of Energy",
      "US DOE"
    ],
    "topics": [
      "energy",
      "nuclear",
      "infrastructure"
    ],
    "whyItMatters": "DOE actions affect strategic reserves, nuclear policy and energy infrastructure.",
    "highValueSignals": [
      "SPR release",
      "nuclear",
      "grid emergency",
      "LNG authorization"
    ]
  },
  {
    "id": "eia",
    "name": "US Energy Information Administration",
    "regionId": "north-america",
    "countryCode": "US",
    "kind": "energy-data",
    "priority": 89,
    "aliases": [
      "EIA",
      "Energy Information Administration"
    ],
    "topics": [
      "energy",
      "markets"
    ],
    "whyItMatters": "EIA data can move expectations for oil, gas, inventories and production.",
    "highValueSignals": [
      "inventory",
      "production forecast",
      "storage",
      "demand outlook"
    ]
  },
  {
    "id": "cisa",
    "name": "Cybersecurity and Infrastructure Security Agency",
    "regionId": "north-america",
    "countryCode": "US",
    "kind": "cyber-authority",
    "priority": 93,
    "aliases": [
      "CISA"
    ],
    "topics": [
      "cyber",
      "infrastructure"
    ],
    "whyItMatters": "CISA alerts provide primary warnings on material cyber threats to critical infrastructure.",
    "highValueSignals": [
      "emergency directive",
      "known exploited",
      "critical infrastructure",
      "incident"
    ]
  },
  {
    "id": "white-house",
    "name": "White House",
    "regionId": "north-america",
    "countryCode": "US",
    "kind": "executive",
    "priority": 97,
    "aliases": [
      "White House",
      "President of the United States"
    ],
    "topics": [
      "policy",
      "diplomacy",
      "conflict",
      "trade"
    ],
    "whyItMatters": "Executive announcements can immediately alter sanctions, tariffs, military posture and diplomacy.",
    "highValueSignals": [
      "executive order",
      "national emergency",
      "tariff",
      "military action",
      "summit"
    ]
  },
  {
    "id": "ecb",
    "name": "European Central Bank",
    "regionId": "europe",
    "countryCode": "EU",
    "kind": "central-bank",
    "priority": 100,
    "aliases": [
      "ECB",
      "European Central Bank"
    ],
    "topics": [
      "macro",
      "rates",
      "financial-stability"
    ],
    "whyItMatters": "ECB policy materially affects EUR rates, European credit and risk assets.",
    "highValueSignals": [
      "rate decision",
      "PEPP",
      "balance sheet",
      "inflation forecast"
    ]
  },
  {
    "id": "eu-council",
    "name": "Council of the European Union",
    "regionId": "europe",
    "countryCode": "EU",
    "kind": "policy-authority",
    "priority": 97,
    "aliases": [
      "EU Council",
      "Council of the EU",
      "European Council"
    ],
    "topics": [
      "sanctions",
      "policy",
      "trade"
    ],
    "whyItMatters": "Council decisions make major EU sanctions and strategic policy changes operative.",
    "highValueSignals": [
      "sanctions package",
      "restrictive measures",
      "summit conclusions",
      "trade measure"
    ]
  },
  {
    "id": "eu-commission",
    "name": "European Commission",
    "regionId": "europe",
    "countryCode": "EU",
    "kind": "executive",
    "priority": 96,
    "aliases": [
      "European Commission",
      "EU Commission"
    ],
    "topics": [
      "trade",
      "policy",
      "energy"
    ],
    "whyItMatters": "Commission actions shape trade defence, industrial policy, competition and energy rules.",
    "highValueSignals": [
      "tariff",
      "anti-subsidy",
      "energy measure",
      "industrial policy"
    ]
  },
  {
    "id": "eeas",
    "name": "European External Action Service",
    "regionId": "europe",
    "countryCode": "EU",
    "kind": "foreign-service",
    "priority": 91,
    "aliases": [
      "EEAS",
      "European External Action Service"
    ],
    "topics": [
      "diplomacy",
      "sanctions",
      "conflict"
    ],
    "whyItMatters": "EEAS statements help establish official EU foreign-policy direction.",
    "highValueSignals": [
      "statement",
      "sanctions",
      "diplomatic mission",
      "security policy"
    ]
  },
  {
    "id": "nato",
    "name": "NATO",
    "regionId": "europe",
    "countryCode": "NATO",
    "kind": "alliance",
    "priority": 100,
    "aliases": [
      "NATO",
      "North Atlantic Treaty Organization"
    ],
    "topics": [
      "conflict",
      "military",
      "security"
    ],
    "whyItMatters": "NATO force posture, readiness and Article 5 signalling directly affect European security risk.",
    "highValueSignals": [
      "deployment",
      "readiness",
      "exercise",
      "Article 5",
      "air policing"
    ]
  },
  {
    "id": "boe",
    "name": "Bank of England",
    "regionId": "europe",
    "countryCode": "GB",
    "kind": "central-bank",
    "priority": 94,
    "aliases": [
      "Bank of England",
      "BoE",
      "MPC"
    ],
    "topics": [
      "macro",
      "rates",
      "financial-stability"
    ],
    "whyItMatters": "BoE policy drives GBP rates and UK financial conditions.",
    "highValueSignals": [
      "rate decision",
      "financial stability",
      "gilt market",
      "inflation forecast"
    ]
  },
  {
    "id": "fcdO",
    "name": "UK Foreign, Commonwealth & Development Office",
    "regionId": "europe",
    "countryCode": "GB",
    "kind": "foreign-ministry",
    "priority": 91,
    "aliases": [
      "FCDO",
      "Foreign Office"
    ],
    "topics": [
      "diplomacy",
      "security",
      "sanctions"
    ],
    "whyItMatters": "FCDO updates are primary UK evidence for foreign policy, sanctions and travel/security changes.",
    "highValueSignals": [
      "travel advice",
      "sanctions",
      "diplomatic statement",
      "evacuation"
    ]
  },
  {
    "id": "hmt",
    "name": "HM Treasury",
    "regionId": "europe",
    "countryCode": "GB",
    "kind": "finance-ministry",
    "priority": 90,
    "aliases": [
      "HM Treasury",
      "HMT"
    ],
    "topics": [
      "sanctions",
      "fiscal",
      "finance"
    ],
    "whyItMatters": "UK Treasury decisions can affect sanctions enforcement, fiscal policy and financial markets.",
    "highValueSignals": [
      "sanctions",
      "budget",
      "financial stability",
      "asset freeze"
    ]
  },
  {
    "id": "bundesbank",
    "name": "Deutsche Bundesbank",
    "regionId": "europe",
    "countryCode": "DE",
    "kind": "central-bank",
    "priority": 86,
    "aliases": [
      "Bundesbank",
      "Deutsche Bundesbank"
    ],
    "topics": [
      "macro",
      "finance"
    ],
    "whyItMatters": "German central-bank signals are useful for euro-area policy and German economic stress.",
    "highValueSignals": [
      "inflation",
      "financial stability",
      "growth forecast"
    ]
  },
  {
    "id": "bnetza",
    "name": "Bundesnetzagentur",
    "regionId": "europe",
    "countryCode": "DE",
    "kind": "energy-regulator",
    "priority": 89,
    "aliases": [
      "Bundesnetzagentur",
      "BNetzA"
    ],
    "topics": [
      "energy",
      "infrastructure"
    ],
    "whyItMatters": "German network regulator data can identify gas and electricity supply stress early.",
    "highValueSignals": [
      "gas storage",
      "network emergency",
      "power grid",
      "supply warning"
    ]
  },
  {
    "id": "nbp",
    "name": "National Bank of Poland",
    "regionId": "europe",
    "countryCode": "PL",
    "kind": "central-bank",
    "priority": 84,
    "aliases": [
      "NBP",
      "National Bank of Poland"
    ],
    "topics": [
      "macro",
      "rates"
    ],
    "whyItMatters": "Polish monetary policy matters for Central European FX and regional risk.",
    "highValueSignals": [
      "rate decision",
      "FX intervention",
      "inflation"
    ]
  },
  {
    "id": "ukraine-mod",
    "name": "Ministry of Defence of Ukraine",
    "regionId": "europe",
    "countryCode": "UA",
    "kind": "defence-ministry",
    "priority": 92,
    "aliases": [
      "Ukraine Ministry of Defence",
      "Ukrainian Defence Ministry"
    ],
    "topics": [
      "conflict",
      "military"
    ],
    "whyItMatters": "Primary Ukrainian military claims are important but require independent corroboration for battlefield facts.",
    "highValueSignals": [
      "strike",
      "mobilisation",
      "front line",
      "air defence"
    ]
  },
  {
    "id": "naftogaz",
    "name": "Naftogaz",
    "regionId": "europe",
    "countryCode": "UA",
    "kind": "energy-company",
    "priority": 85,
    "aliases": [
      "Naftogaz"
    ],
    "topics": [
      "energy",
      "infrastructure"
    ],
    "whyItMatters": "Naftogaz updates can reveal gas transit, storage and infrastructure disruption.",
    "highValueSignals": [
      "transit",
      "storage",
      "pipeline",
      "damage"
    ]
  },
  {
    "id": "kremlin",
    "name": "Kremlin",
    "regionId": "russia-eurasia",
    "countryCode": "RU",
    "kind": "executive",
    "priority": 98,
    "aliases": [
      "Kremlin",
      "Russian Presidency"
    ],
    "topics": [
      "policy",
      "conflict",
      "diplomacy"
    ],
    "whyItMatters": "Kremlin statements are primary Russian policy signals but should not be treated as independent factual confirmation.",
    "highValueSignals": [
      "mobilisation",
      "decree",
      "nuclear doctrine",
      "summit",
      "ceasefire"
    ]
  },
  {
    "id": "ru-mfa",
    "name": "Russian Ministry of Foreign Affairs",
    "regionId": "russia-eurasia",
    "countryCode": "RU",
    "kind": "foreign-ministry",
    "priority": 92,
    "aliases": [
      "Russian Foreign Ministry",
      "Russia MFA",
      "MID Russia"
    ],
    "topics": [
      "diplomacy",
      "sanctions",
      "conflict"
    ],
    "whyItMatters": "Russian MFA statements provide official diplomatic signalling and retaliation warnings.",
    "highValueSignals": [
      "retaliation",
      "diplomatic note",
      "sanctions response",
      "treaty"
    ]
  },
  {
    "id": "cbr",
    "name": "Central Bank of Russia",
    "regionId": "russia-eurasia",
    "countryCode": "RU",
    "kind": "central-bank",
    "priority": 96,
    "aliases": [
      "Central Bank of Russia",
      "Bank of Russia",
      "CBR"
    ],
    "topics": [
      "macro",
      "rates",
      "capital-controls"
    ],
    "whyItMatters": "CBR decisions reveal domestic financial stress, inflation and capital-control changes.",
    "highValueSignals": [
      "rate decision",
      "capital controls",
      "FX restrictions",
      "liquidity"
    ]
  },
  {
    "id": "ru-finmin",
    "name": "Russian Ministry of Finance",
    "regionId": "russia-eurasia",
    "countryCode": "RU",
    "kind": "finance-ministry",
    "priority": 90,
    "aliases": [
      "Russian Finance Ministry",
      "Minfin"
    ],
    "topics": [
      "fiscal",
      "energy",
      "finance"
    ],
    "whyItMatters": "Russian fiscal and oil-tax decisions affect sovereign funding and energy-export economics.",
    "highValueSignals": [
      "budget",
      "oil revenue",
      "bond issuance",
      "tax"
    ]
  },
  {
    "id": "ru-mod",
    "name": "Russian Ministry of Defence",
    "regionId": "russia-eurasia",
    "countryCode": "RU",
    "kind": "defence-ministry",
    "priority": 91,
    "aliases": [
      "Russian Defence Ministry",
      "Russia MoD"
    ],
    "topics": [
      "conflict",
      "military"
    ],
    "whyItMatters": "Primary Russian military claims are significant signalling but require independent corroboration.",
    "highValueSignals": [
      "mobilisation",
      "strike",
      "exercise",
      "deployment"
    ]
  },
  {
    "id": "gazprom",
    "name": "Gazprom",
    "regionId": "russia-eurasia",
    "countryCode": "RU",
    "kind": "energy-company",
    "priority": 89,
    "aliases": [
      "Gazprom"
    ],
    "topics": [
      "energy",
      "shipping"
    ],
    "whyItMatters": "Gazprom flow and contract changes can materially affect European and Eurasian gas supply.",
    "highValueSignals": [
      "pipeline flow",
      "force majeure",
      "maintenance",
      "contract"
    ]
  },
  {
    "id": "transneft",
    "name": "Transneft",
    "regionId": "russia-eurasia",
    "countryCode": "RU",
    "kind": "pipeline-operator",
    "priority": 88,
    "aliases": [
      "Transneft"
    ],
    "topics": [
      "energy",
      "infrastructure"
    ],
    "whyItMatters": "Transneft disruptions can affect Russian crude export and pipeline throughput.",
    "highValueSignals": [
      "pipeline outage",
      "Druzhba",
      "export terminal",
      "maintenance"
    ]
  },
  {
    "id": "cpc",
    "name": "Caspian Pipeline Consortium",
    "regionId": "russia-eurasia",
    "countryCode": "KZ",
    "kind": "pipeline-operator",
    "priority": 88,
    "aliases": [
      "Caspian Pipeline Consortium",
      "CPC"
    ],
    "topics": [
      "energy",
      "shipping"
    ],
    "whyItMatters": "CPC disruptions affect large Kazakh crude flows through the Black Sea.",
    "highValueSignals": [
      "terminal outage",
      "loading restriction",
      "pipeline damage",
      "maintenance"
    ]
  },
  {
    "id": "nbk",
    "name": "National Bank of Kazakhstan",
    "regionId": "russia-eurasia",
    "countryCode": "KZ",
    "kind": "central-bank",
    "priority": 80,
    "aliases": [
      "National Bank of Kazakhstan"
    ],
    "topics": [
      "macro",
      "rates"
    ],
    "whyItMatters": "Kazakh policy can signal Central Asian financial and commodity conditions.",
    "highValueSignals": [
      "rate decision",
      "FX intervention",
      "inflation"
    ]
  },
  {
    "id": "iaea",
    "name": "International Atomic Energy Agency",
    "regionId": "middle-east",
    "countryCode": "UN",
    "kind": "nuclear-monitor",
    "priority": 100,
    "aliases": [
      "IAEA",
      "International Atomic Energy Agency"
    ],
    "topics": [
      "nuclear",
      "conflict",
      "diplomacy"
    ],
    "whyItMatters": "IAEA verification is central to assessing nuclear escalation and compliance claims.",
    "highValueSignals": [
      "enrichment",
      "inspectors",
      "safeguards",
      "uranium stockpile",
      "resolution"
    ]
  },
  {
    "id": "iran-mfa",
    "name": "Iranian Ministry of Foreign Affairs",
    "regionId": "middle-east",
    "countryCode": "IR",
    "kind": "foreign-ministry",
    "priority": 91,
    "aliases": [
      "Iranian Foreign Ministry",
      "Iran MFA"
    ],
    "topics": [
      "diplomacy",
      "sanctions",
      "conflict"
    ],
    "whyItMatters": "Official Iranian diplomatic signalling is important for escalation and negotiations but needs independent corroboration.",
    "highValueSignals": [
      "negotiation",
      "retaliation",
      "sanctions",
      "nuclear talks"
    ]
  },
  {
    "id": "irgc",
    "name": "Islamic Revolutionary Guard Corps",
    "regionId": "middle-east",
    "countryCode": "IR",
    "kind": "military-security",
    "priority": 97,
    "aliases": [
      "IRGC",
      "Revolutionary Guard",
      "Islamic Revolutionary Guard Corps"
    ],
    "topics": [
      "conflict",
      "shipping",
      "security"
    ],
    "whyItMatters": "IRGC statements and force movements are high-value indicators around Gulf escalation and shipping risk.",
    "highValueSignals": [
      "missile",
      "drone",
      "naval exercise",
      "seizure",
      "retaliation"
    ]
  },
  {
    "id": "iran-cbi",
    "name": "Central Bank of Iran",
    "regionId": "middle-east",
    "countryCode": "IR",
    "kind": "central-bank",
    "priority": 82,
    "aliases": [
      "Central Bank of Iran",
      "CBI Iran"
    ],
    "topics": [
      "macro",
      "sanctions",
      "finance"
    ],
    "whyItMatters": "Iranian currency and payment measures can reveal sanctions pressure and financial stress.",
    "highValueSignals": [
      "FX",
      "payment restriction",
      "rial",
      "banking"
    ]
  },
  {
    "id": "nioc",
    "name": "National Iranian Oil Company",
    "regionId": "middle-east",
    "countryCode": "IR",
    "kind": "energy-company",
    "priority": 89,
    "aliases": [
      "NIOC",
      "National Iranian Oil Company"
    ],
    "topics": [
      "energy",
      "shipping",
      "sanctions"
    ],
    "whyItMatters": "NIOC export and production signals matter for sanctioned oil supply.",
    "highValueSignals": [
      "oil exports",
      "production",
      "terminal",
      "contract"
    ]
  },
  {
    "id": "idf",
    "name": "Israel Defense Forces",
    "regionId": "middle-east",
    "countryCode": "IL",
    "kind": "military",
    "priority": 98,
    "aliases": [
      "IDF",
      "Israel Defense Forces"
    ],
    "topics": [
      "conflict",
      "military",
      "security"
    ],
    "whyItMatters": "IDF operational statements are primary evidence for Israeli military actions but should be corroborated for contested facts.",
    "highValueSignals": [
      "strike",
      "intercept",
      "mobilisation",
      "evacuation order"
    ]
  },
  {
    "id": "israel-pmo",
    "name": "Prime Minister’s Office of Israel",
    "regionId": "middle-east",
    "countryCode": "IL",
    "kind": "executive",
    "priority": 95,
    "aliases": [
      "Israel PMO",
      "Prime Minister of Israel"
    ],
    "topics": [
      "policy",
      "conflict",
      "diplomacy"
    ],
    "whyItMatters": "Israeli executive decisions can rapidly change escalation, ceasefire and mobilisation expectations.",
    "highValueSignals": [
      "security cabinet",
      "ceasefire",
      "military operation",
      "negotiation"
    ]
  },
  {
    "id": "boi",
    "name": "Bank of Israel",
    "regionId": "middle-east",
    "countryCode": "IL",
    "kind": "central-bank",
    "priority": 86,
    "aliases": [
      "Bank of Israel"
    ],
    "topics": [
      "macro",
      "rates",
      "financial-stability"
    ],
    "whyItMatters": "BoI decisions can signal economic stress from conflict and affect ILS markets.",
    "highValueSignals": [
      "rate decision",
      "FX intervention",
      "financial stability"
    ]
  },
  {
    "id": "saudi-energy",
    "name": "Saudi Ministry of Energy",
    "regionId": "middle-east",
    "countryCode": "SA",
    "kind": "energy-ministry",
    "priority": 96,
    "aliases": [
      "Saudi Energy Ministry",
      "Ministry of Energy Saudi Arabia"
    ],
    "topics": [
      "energy",
      "oil",
      "policy"
    ],
    "whyItMatters": "Saudi production policy is central to global crude supply expectations.",
    "highValueSignals": [
      "production cut",
      "OPEC+",
      "capacity",
      "oil policy"
    ]
  },
  {
    "id": "aramco",
    "name": "Saudi Aramco",
    "regionId": "middle-east",
    "countryCode": "SA",
    "kind": "energy-company",
    "priority": 94,
    "aliases": [
      "Saudi Aramco",
      "Aramco"
    ],
    "topics": [
      "energy",
      "infrastructure"
    ],
    "whyItMatters": "Aramco operational disruptions can have immediate global oil-market consequences.",
    "highValueSignals": [
      "facility attack",
      "production outage",
      "export terminal",
      "capacity"
    ]
  },
  {
    "id": "sama",
    "name": "Saudi Central Bank",
    "regionId": "middle-east",
    "countryCode": "SA",
    "kind": "central-bank",
    "priority": 82,
    "aliases": [
      "SAMA",
      "Saudi Central Bank"
    ],
    "topics": [
      "macro",
      "finance"
    ],
    "whyItMatters": "SAMA data helps assess Gulf liquidity and financial conditions.",
    "highValueSignals": [
      "liquidity",
      "banking",
      "reserves"
    ]
  },
  {
    "id": "uae-energy",
    "name": "UAE Ministry of Energy and Infrastructure",
    "regionId": "middle-east",
    "countryCode": "AE",
    "kind": "energy-ministry",
    "priority": 88,
    "aliases": [
      "UAE Energy Ministry"
    ],
    "topics": [
      "energy",
      "shipping"
    ],
    "whyItMatters": "UAE energy and infrastructure announcements affect Gulf production and logistics.",
    "highValueSignals": [
      "production",
      "Fujairah",
      "shipping",
      "infrastructure"
    ]
  },
  {
    "id": "qatarenergy",
    "name": "QatarEnergy",
    "regionId": "middle-east",
    "countryCode": "QA",
    "kind": "energy-company",
    "priority": 94,
    "aliases": [
      "QatarEnergy"
    ],
    "topics": [
      "energy",
      "LNG",
      "shipping"
    ],
    "whyItMatters": "QatarEnergy changes can materially affect global LNG supply and tanker demand.",
    "highValueSignals": [
      "LNG cargo",
      "Ras Laffan",
      "production expansion",
      "force majeure"
    ]
  },
  {
    "id": "oman-mfa",
    "name": "Oman Ministry of Foreign Affairs",
    "regionId": "middle-east",
    "countryCode": "OM",
    "kind": "foreign-ministry",
    "priority": 83,
    "aliases": [
      "Oman Foreign Ministry",
      "Oman MFA"
    ],
    "topics": [
      "diplomacy",
      "conflict"
    ],
    "whyItMatters": "Oman is a key mediator in Gulf diplomacy, making official statements useful de-escalation indicators.",
    "highValueSignals": [
      "mediation",
      "talks",
      "ceasefire",
      "US Iran"
    ]
  },
  {
    "id": "pboc",
    "name": "People’s Bank of China",
    "regionId": "strategic-asia",
    "countryCode": "CN",
    "kind": "central-bank",
    "priority": 98,
    "aliases": [
      "PBOC",
      "People’s Bank of China"
    ],
    "topics": [
      "macro",
      "rates",
      "finance"
    ],
    "whyItMatters": "PBOC liquidity and FX decisions influence Chinese and global risk assets and commodities.",
    "highValueSignals": [
      "reserve requirement",
      "liquidity",
      "fixing",
      "rate cut",
      "FX"
    ]
  },
  {
    "id": "mofcom",
    "name": "Ministry of Commerce of China",
    "regionId": "strategic-asia",
    "countryCode": "CN",
    "kind": "trade-ministry",
    "priority": 96,
    "aliases": [
      "MOFCOM",
      "China Ministry of Commerce"
    ],
    "topics": [
      "trade",
      "export-controls",
      "policy"
    ],
    "whyItMatters": "MOFCOM controls and retaliation can change critical-mineral and trade exposure.",
    "highValueSignals": [
      "export control",
      "unreliable entity",
      "tariff",
      "rare earth"
    ]
  },
  {
    "id": "china-mod",
    "name": "Ministry of National Defense of China",
    "regionId": "strategic-asia",
    "countryCode": "CN",
    "kind": "defence-ministry",
    "priority": 95,
    "aliases": [
      "China Ministry of Defense",
      "PRC Ministry of National Defense"
    ],
    "topics": [
      "conflict",
      "military",
      "taiwan"
    ],
    "whyItMatters": "Chinese military statements are high-value signalling around Taiwan and regional force posture.",
    "highValueSignals": [
      "exercise",
      "Taiwan",
      "deployment",
      "warning"
    ]
  },
  {
    "id": "taiwan-mod",
    "name": "Ministry of National Defense of Taiwan",
    "regionId": "strategic-asia",
    "countryCode": "TW",
    "kind": "defence-ministry",
    "priority": 97,
    "aliases": [
      "Taiwan Ministry of National Defense",
      "Taiwan MND"
    ],
    "topics": [
      "conflict",
      "military",
      "taiwan"
    ],
    "whyItMatters": "Taiwan MND reports provide primary monitoring of PLA air and maritime activity.",
    "highValueSignals": [
      "PLA aircraft",
      "naval vessels",
      "exercise",
      "air defence zone"
    ]
  },
  {
    "id": "taiwan-cbc",
    "name": "Central Bank of the Republic of China (Taiwan)",
    "regionId": "strategic-asia",
    "countryCode": "TW",
    "kind": "central-bank",
    "priority": 84,
    "aliases": [
      "Taiwan central bank",
      "CBC Taiwan"
    ],
    "topics": [
      "macro",
      "rates",
      "FX"
    ],
    "whyItMatters": "Taiwan monetary and FX actions matter for TWD and technology-sector financial conditions.",
    "highValueSignals": [
      "rate decision",
      "FX intervention",
      "capital flow"
    ]
  },
  {
    "id": "tsmc",
    "name": "TSMC",
    "regionId": "strategic-asia",
    "countryCode": "TW",
    "kind": "strategic-company",
    "priority": 96,
    "aliases": [
      "TSMC",
      "Taiwan Semiconductor Manufacturing"
    ],
    "topics": [
      "semiconductors",
      "supply-chain"
    ],
    "whyItMatters": "TSMC capacity and disruption signals are critical to advanced semiconductor supply.",
    "highValueSignals": [
      "fab outage",
      "capacity",
      "advanced node",
      "CoWoS",
      "export restriction"
    ]
  },
  {
    "id": "boj",
    "name": "Bank of Japan",
    "regionId": "strategic-asia",
    "countryCode": "JP",
    "kind": "central-bank",
    "priority": 98,
    "aliases": [
      "Bank of Japan",
      "BOJ"
    ],
    "topics": [
      "macro",
      "rates",
      "FX"
    ],
    "whyItMatters": "BOJ policy can materially move JPY, global carry trades and sovereign yields.",
    "highValueSignals": [
      "rate decision",
      "yield curve",
      "bond purchase",
      "FX conditions"
    ]
  },
  {
    "id": "japan-mofa",
    "name": "Ministry of Foreign Affairs of Japan",
    "regionId": "strategic-asia",
    "countryCode": "JP",
    "kind": "foreign-ministry",
    "priority": 90,
    "aliases": [
      "Japan MOFA",
      "Japanese Foreign Ministry"
    ],
    "topics": [
      "diplomacy",
      "security"
    ],
    "whyItMatters": "Japanese official statements matter for alliance posture, sanctions and regional security.",
    "highValueSignals": [
      "sanctions",
      "Taiwan Strait",
      "North Korea",
      "alliance"
    ]
  },
  {
    "id": "meti",
    "name": "Ministry of Economy, Trade and Industry of Japan",
    "regionId": "strategic-asia",
    "countryCode": "JP",
    "kind": "trade-ministry",
    "priority": 94,
    "aliases": [
      "METI",
      "Japan Ministry of Economy Trade and Industry"
    ],
    "topics": [
      "trade",
      "semiconductors",
      "energy"
    ],
    "whyItMatters": "METI controls influence semiconductor equipment, energy security and industrial policy.",
    "highValueSignals": [
      "export control",
      "semiconductor equipment",
      "LNG",
      "industrial policy"
    ]
  },
  {
    "id": "bok",
    "name": "Bank of Korea",
    "regionId": "strategic-asia",
    "countryCode": "KR",
    "kind": "central-bank",
    "priority": 89,
    "aliases": [
      "Bank of Korea",
      "BOK"
    ],
    "topics": [
      "macro",
      "rates",
      "FX"
    ],
    "whyItMatters": "Korean monetary policy affects KRW and a major export manufacturing economy.",
    "highValueSignals": [
      "rate decision",
      "FX",
      "financial stability"
    ]
  },
  {
    "id": "rok-mod",
    "name": "Ministry of National Defense of South Korea",
    "regionId": "strategic-asia",
    "countryCode": "KR",
    "kind": "defence-ministry",
    "priority": 94,
    "aliases": [
      "South Korea Ministry of National Defense",
      "ROK MND"
    ],
    "topics": [
      "conflict",
      "military",
      "north-korea"
    ],
    "whyItMatters": "ROK defence statements are primary evidence for North Korean launches and peninsula posture.",
    "highValueSignals": [
      "missile launch",
      "exercise",
      "border",
      "readiness"
    ]
  },
  {
    "id": "motie",
    "name": "Ministry of Trade, Industry and Energy of South Korea",
    "regionId": "strategic-asia",
    "countryCode": "KR",
    "kind": "trade-ministry",
    "priority": 90,
    "aliases": [
      "MOTIE",
      "Korea Ministry of Trade Industry and Energy"
    ],
    "topics": [
      "trade",
      "semiconductors",
      "energy"
    ],
    "whyItMatters": "MOTIE policy affects chips, batteries, exports and Korean energy security.",
    "highValueSignals": [
      "semiconductor",
      "battery",
      "export",
      "LNG"
    ]
  },
  {
    "id": "mas",
    "name": "Monetary Authority of Singapore",
    "regionId": "strategic-asia",
    "countryCode": "SG",
    "kind": "central-bank",
    "priority": 88,
    "aliases": [
      "MAS",
      "Monetary Authority of Singapore"
    ],
    "topics": [
      "macro",
      "finance"
    ],
    "whyItMatters": "Singapore is a major Asian financial and shipping hub; MAS changes can signal regional liquidity conditions.",
    "highValueSignals": [
      "policy band",
      "financial stability",
      "banking"
    ]
  },
  {
    "id": "mpa-sg",
    "name": "Maritime and Port Authority of Singapore",
    "regionId": "strategic-asia",
    "countryCode": "SG",
    "kind": "port-authority",
    "priority": 91,
    "aliases": [
      "MPA Singapore",
      "Maritime and Port Authority of Singapore"
    ],
    "topics": [
      "shipping",
      "infrastructure"
    ],
    "whyItMatters": "Singapore port notices can reveal disruptions at a core Malacca-linked global shipping hub.",
    "highValueSignals": [
      "port closure",
      "collision",
      "bunker",
      "traffic restriction"
    ]
  },
  {
    "id": "philippine-pcg",
    "name": "Philippine Coast Guard",
    "regionId": "strategic-asia",
    "countryCode": "PH",
    "kind": "coast-guard",
    "priority": 90,
    "aliases": [
      "Philippine Coast Guard",
      "PCG"
    ],
    "topics": [
      "conflict",
      "shipping",
      "south-china-sea"
    ],
    "whyItMatters": "PCG reports are important primary evidence for South China Sea confrontations.",
    "highValueSignals": [
      "collision",
      "water cannon",
      "Second Thomas Shoal",
      "Scarborough"
    ]
  }
]);
