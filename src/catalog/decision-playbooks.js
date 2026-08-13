export const DECISION_PLAYBOOKS = Object.freeze([
  {
    "id": "us-iran-war",
    "name": "US–Iran direct escalation",
    "regions": [
      "middle-east",
      "north-america"
    ],
    "triggerConcepts": [
      "US strikes Iran",
      "Iran attacks US forces",
      "IRGC retaliation",
      "Hormuz threat",
      "embassy evacuation"
    ],
    "priorityInstitutions": [
      "centcom",
      "dod",
      "state",
      "white-house",
      "iran-mfa",
      "irgc",
      "iaea"
    ],
    "strategicNodes": [
      "hormuz",
      "al-udeid",
      "bandar-abbas",
      "kharg"
    ],
    "financialExposures": [
      "brent",
      "tanker",
      "gold",
      "airlines",
      "usd-index"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "additional US force deployments",
      "Iranian missile/drone launches",
      "commercial shipping warnings",
      "airspace closures",
      "embassy ordered departure"
    ],
    "invalidationSignals": [
      "verified ceasefire",
      "withdrawal of additional forces",
      "restoration of normal shipping",
      "direct mediated agreement"
    ],
    "decisionQuestions": [
      "Is the action symbolic or intended to degrade strategic capability?",
      "Is Hormuz traffic physically affected?",
      "Are US regional bases changing protection levels?",
      "Are allies joining or distancing themselves?"
    ],
    "practicalChecks": [
      "official military releases",
      "maritime advisories",
      "NOTAMs",
      "carrier routing",
      "energy terminal operations"
    ]
  },
  {
    "id": "iran-nuclear-crisis",
    "name": "Iran nuclear breakout / inspection crisis",
    "regions": [
      "middle-east"
    ],
    "triggerConcepts": [
      "IAEA access denied",
      "60% enrichment growth",
      "weaponisation concern",
      "inspection cameras removed"
    ],
    "priorityInstitutions": [
      "iaea",
      "iran-mfa",
      "white-house",
      "state",
      "eu-council"
    ],
    "strategicNodes": [
      "natanz",
      "fordow",
      "bushehr"
    ],
    "financialExposures": [
      "brent",
      "gold",
      "tanker"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "IAEA quantified stockpile increase",
      "safeguards dispute",
      "new sanctions",
      "military planning signals"
    ],
    "invalidationSignals": [
      "verified dilution",
      "restored inspections",
      "technical agreement",
      "sanctions relief tied to compliance"
    ],
    "decisionQuestions": [
      "How much verified material exists and at what enrichment?",
      "Is the dispute technical, political or access-related?",
      "Are military options being signalled with costly actions?"
    ],
    "practicalChecks": [
      "read IAEA wording directly",
      "compare official US/Iran statements",
      "monitor airspace and force posture"
    ]
  },
  {
    "id": "hormuz-disruption",
    "name": "Strait of Hormuz disruption",
    "regions": [
      "middle-east"
    ],
    "triggerConcepts": [
      "tanker attack",
      "vessel seizure",
      "mine threat",
      "naval exclusion",
      "shipping halt"
    ],
    "priorityInstitutions": [
      "centcom",
      "irgc",
      "uae-energy",
      "saudi-energy"
    ],
    "strategicNodes": [
      "hormuz",
      "bandar-abbas",
      "fujairah",
      "ras-tanura"
    ],
    "financialExposures": [
      "brent",
      "tanker",
      "lng-eu",
      "airlines"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "major carriers pause passage",
      "war-risk premiums jump",
      "physical vessel damage",
      "naval escorts or exclusion zones"
    ],
    "invalidationSignals": [
      "commercial transits normalize",
      "war-risk premiums fall",
      "naval warnings withdrawn"
    ],
    "decisionQuestions": [
      "What share of flows is actually delayed?",
      "Are LNG and crude equally affected?",
      "Can Fujairah or pipelines bypass the disruption?"
    ],
    "practicalChecks": [
      "AIS/maritime notices",
      "port notices",
      "carrier statements",
      "official naval advisories"
    ]
  },
  {
    "id": "red-sea",
    "name": "Red Sea / Bab el-Mandeb shipping crisis",
    "regions": [
      "middle-east",
      "europe",
      "strategic-asia"
    ],
    "triggerConcepts": [
      "merchant vessel attack",
      "Houthi missile",
      "carrier reroute",
      "Bab el-Mandeb warning"
    ],
    "priorityInstitutions": [
      "centcom",
      "mpa-sg"
    ],
    "strategicNodes": [
      "bab-el-mandeb",
      "suez",
      "eilat"
    ],
    "financialExposures": [
      "container",
      "tanker",
      "brent",
      "airlines"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "multiple carriers reroute",
      "successful strike on vessel",
      "insurance repricing",
      "Suez transits fall"
    ],
    "invalidationSignals": [
      "carriers resume Suez routes",
      "attack tempo falls",
      "credible ceasefire"
    ],
    "decisionQuestions": [
      "Is disruption broad or carrier-specific?",
      "What is added ton-mile demand?",
      "Are container and tanker markets responding differently?"
    ],
    "practicalChecks": [
      "carrier advisories",
      "Suez traffic data",
      "maritime security bulletins",
      "freight indexes"
    ]
  },
  {
    "id": "israel-iran",
    "name": "Israel–Iran direct exchange",
    "regions": [
      "middle-east"
    ],
    "triggerConcepts": [
      "Israeli strike Iran",
      "Iran missile barrage",
      "IRGC retaliation",
      "nuclear site strike"
    ],
    "priorityInstitutions": [
      "idf",
      "israel-pmo",
      "irgc",
      "iran-mfa",
      "iaea"
    ],
    "strategicNodes": [
      "natanz",
      "fordow",
      "haifa",
      "bandar-abbas"
    ],
    "financialExposures": [
      "brent",
      "gold",
      "tanker",
      "airlines"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "repeat strike cycle",
      "strategic site targeted",
      "regional proxies activate",
      "airspace closures broaden"
    ],
    "invalidationSignals": [
      "mediated stand-down",
      "no follow-on strikes",
      "airspace normalizes"
    ],
    "decisionQuestions": [
      "Are strikes calibrated or expanding target classes?",
      "Are nuclear or energy sites involved?",
      "Are Hezbollah/Houthis joining materially?"
    ],
    "practicalChecks": [
      "official operational statements",
      "satellite/credible independent reporting",
      "airspace restrictions",
      "energy operations"
    ]
  },
  {
    "id": "gulf-energy-attack",
    "name": "Gulf energy infrastructure attack",
    "regions": [
      "middle-east"
    ],
    "triggerConcepts": [
      "Aramco attack",
      "Ras Tanura attack",
      "Abqaiq outage",
      "Ras Laffan outage",
      "Fujairah incident"
    ],
    "priorityInstitutions": [
      "aramco",
      "saudi-energy",
      "qatarenergy",
      "uae-energy"
    ],
    "strategicNodes": [
      "abqaiq",
      "ras-tanura",
      "ras-laffan",
      "fujairah"
    ],
    "financialExposures": [
      "brent",
      "lng-eu",
      "tanker"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "operator confirms lost capacity",
      "export nominations reduced",
      "repairs exceed days"
    ],
    "invalidationSignals": [
      "capacity restored",
      "exports maintained from inventory",
      "damage minor"
    ],
    "decisionQuestions": [
      "How much production/export capacity is unavailable?",
      "Is the outage upstream, processing, storage or loading?"
    ],
    "practicalChecks": [
      "operator statements",
      "tanker loadings",
      "government energy releases"
    ]
  },
  {
    "id": "ukraine-escalation",
    "name": "Russia–Ukraine military escalation",
    "regions": [
      "europe",
      "russia-eurasia"
    ],
    "triggerConcepts": [
      "major offensive",
      "mobilisation",
      "long-range strike",
      "NATO border incident"
    ],
    "priorityInstitutions": [
      "nato",
      "ukraine-mod",
      "ru-mod",
      "kremlin"
    ],
    "strategicNodes": [
      "black-sea",
      "odesa",
      "suwalki",
      "kaliningrad"
    ],
    "financialExposures": [
      "brent",
      "wheat",
      "defence-eu",
      "lng-eu"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "territorial expansion",
      "new mobilisation",
      "NATO reinforcement",
      "critical infrastructure attacks"
    ],
    "invalidationSignals": [
      "verified ceasefire",
      "force pullback",
      "monitoring mechanism"
    ],
    "decisionQuestions": [
      "Does the action change force balance or geography?",
      "Is NATO territory or infrastructure directly affected?",
      "Are Black Sea exports disrupted?"
    ],
    "practicalChecks": [
      "NATO statements",
      "official defence releases",
      "port operations",
      "energy grid notices"
    ]
  },
  {
    "id": "black-sea-shipping",
    "name": "Black Sea export disruption",
    "regions": [
      "europe",
      "russia-eurasia"
    ],
    "triggerConcepts": [
      "Odesa attack",
      "Novorossiysk outage",
      "Bosporus restriction",
      "sea mine"
    ],
    "priorityInstitutions": [
      "ukraine-mod",
      "transneft",
      "cpc"
    ],
    "strategicNodes": [
      "odesa",
      "novorossiysk",
      "black-sea"
    ],
    "financialExposures": [
      "wheat",
      "brent",
      "tanker"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "port loading suspended",
      "insurance restrictions",
      "vessel damage"
    ],
    "invalidationSignals": [
      "loadings resume",
      "navigation warning lifted"
    ],
    "decisionQuestions": [
      "Which commodity flow is affected?",
      "Is disruption at Russian, Ukrainian or transit infrastructure?"
    ],
    "practicalChecks": [
      "port authority/operator releases",
      "vessel traffic",
      "commodity export data"
    ]
  },
  {
    "id": "russia-sanctions",
    "name": "Major Russia sanctions tightening",
    "regions": [
      "russia-eurasia",
      "europe",
      "north-america"
    ],
    "triggerConcepts": [
      "secondary sanctions",
      "shadow fleet sanctions",
      "bank sanctions",
      "oil price cap enforcement"
    ],
    "priorityInstitutions": [
      "ofac",
      "ust",
      "eu-council",
      "hmt"
    ],
    "strategicNodes": [
      "novorossiysk",
      "primorsk",
      "ust-luga"
    ],
    "financialExposures": [
      "brent",
      "tanker",
      "ruble",
      "aluminium",
      "palladium"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "banks/carriers withdraw services",
      "freight discounts widen",
      "payment delays rise"
    ],
    "invalidationSignals": [
      "broad licensing relief",
      "enforcement paused",
      "alternative channels absorb impact"
    ],
    "decisionQuestions": [
      "Are measures legally effective immediately?",
      "Do they target volumes, prices, payment or logistics?",
      "Are third-country entities exposed?"
    ],
    "practicalChecks": [
      "read sanctions text",
      "operator/bank responses",
      "shipping behavior",
      "price differentials"
    ]
  },
  {
    "id": "russia-finance",
    "name": "Russian financial stress",
    "regions": [
      "russia-eurasia"
    ],
    "triggerConcepts": [
      "capital controls",
      "emergency rate hike",
      "bank liquidity stress",
      "rouble collapse"
    ],
    "priorityInstitutions": [
      "cbr",
      "ru-finmin"
    ],
    "strategicNodes": [
      "ny-finance"
    ],
    "financialExposures": [
      "ruble",
      "gold"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "withdrawal restrictions",
      "mandatory FX conversion",
      "unscheduled policy meeting"
    ],
    "invalidationSignals": [
      "controls eased",
      "market access normalizes",
      "inflation pressure falls"
    ],
    "decisionQuestions": [
      "Is stress caused by sanctions, fiscal policy or domestic confidence?",
      "Are official rates representative?"
    ],
    "practicalChecks": [
      "CBR releases",
      "bank notices",
      "offshore/onshore price gaps"
    ]
  },
  {
    "id": "baltic-hybrid",
    "name": "Baltic hybrid / infrastructure crisis",
    "regions": [
      "europe",
      "russia-eurasia"
    ],
    "triggerConcepts": [
      "undersea cable damage",
      "GPS jamming",
      "border incident",
      "sabotage"
    ],
    "priorityInstitutions": [
      "nato",
      "eu-council",
      "kremlin"
    ],
    "strategicNodes": [
      "kaliningrad",
      "suwalki"
    ],
    "financialExposures": [
      "defence-eu",
      "lng-eu"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "NATO consultation",
      "multiple infrastructure incidents",
      "attribution confidence rises"
    ],
    "invalidationSignals": [
      "technical fault established",
      "incidents stop",
      "deconfliction"
    ],
    "decisionQuestions": [
      "Is attribution evidenced or political?",
      "Does the event affect connectivity, energy or military access?"
    ],
    "practicalChecks": [
      "operator outage data",
      "NATO/government statements",
      "technical investigation"
    ]
  },
  {
    "id": "europe-energy",
    "name": "European gas/power shock",
    "regions": [
      "europe",
      "middle-east",
      "russia-eurasia"
    ],
    "triggerConcepts": [
      "pipeline outage",
      "LNG force majeure",
      "grid emergency",
      "gas storage warning"
    ],
    "priorityInstitutions": [
      "ecb",
      "bnetza",
      "gazprom",
      "qatarenergy"
    ],
    "strategicNodes": [
      "rotterdam",
      "yamal",
      "ras-laffan"
    ],
    "financialExposures": [
      "lng-eu",
      "eurusd",
      "eu-autos"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "storage draws accelerate",
      "industrial curtailment",
      "TTF dislocation"
    ],
    "invalidationSignals": [
      "supply restored",
      "storage remains comfortable",
      "demand response offsets loss"
    ],
    "decisionQuestions": [
      "Is the shock physical or price-only?",
      "How much storage buffer remains?",
      "Which industries face curtailment first?"
    ],
    "practicalChecks": [
      "storage data",
      "pipeline nominations",
      "LNG terminal status",
      "grid operator notices"
    ]
  },
  {
    "id": "ecb-surprise",
    "name": "ECB monetary-policy surprise",
    "regions": [
      "europe"
    ],
    "triggerConcepts": [
      "unexpected rate move",
      "guidance shift",
      "emergency liquidity",
      "fragmentation tool"
    ],
    "priorityInstitutions": [
      "ecb",
      "bundesbank"
    ],
    "strategicNodes": [
      "ny-finance"
    ],
    "financialExposures": [
      "eurusd",
      "eu-autos"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "yield curve reprices",
      "bank funding stress",
      "new facility announced"
    ],
    "invalidationSignals": [
      "guidance reversed",
      "inflation/growth data invalidate move"
    ],
    "decisionQuestions": [
      "Is this inflation, growth or financial-stability driven?",
      "Does periphery spread stress alter transmission?"
    ],
    "practicalChecks": [
      "ECB statement",
      "press conference",
      "money-market pricing"
    ]
  },
  {
    "id": "europe-political",
    "name": "Major European political instability",
    "regions": [
      "europe"
    ],
    "triggerConcepts": [
      "government collapse",
      "snap election",
      "budget rejection",
      "mass strike"
    ],
    "priorityInstitutions": [
      "eu-commission",
      "eu-council",
      "ecb"
    ],
    "strategicNodes": [
      "rotterdam",
      "antwerp"
    ],
    "financialExposures": [
      "eurusd",
      "eu-autos",
      "defence-eu"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "confidence vote lost",
      "coalition breaks",
      "fiscal deadline missed",
      "transport shutdown"
    ],
    "invalidationSignals": [
      "new stable coalition",
      "budget agreement",
      "strike settlement"
    ],
    "decisionQuestions": [
      "Does instability change fiscal, defence, sanctions or trade policy?",
      "Are logistics physically disrupted?"
    ],
    "practicalChecks": [
      "parliament/government sources",
      "transport operator notices",
      "bond spreads"
    ]
  },
  {
    "id": "taiwan-blockade",
    "name": "Taiwan blockade/quarantine crisis",
    "regions": [
      "strategic-asia",
      "north-america"
    ],
    "triggerConcepts": [
      "blockade",
      "quarantine",
      "encirclement drills",
      "shipping exclusion"
    ],
    "priorityInstitutions": [
      "taiwan-mod",
      "china-mod",
      "dod",
      "japan-mofa"
    ],
    "strategicNodes": [
      "taiwan-strait",
      "luzon",
      "hsinchu",
      "kaohsiung"
    ],
    "financialExposures": [
      "taiwan-eq",
      "semis",
      "usdtwd",
      "container",
      "nikkei"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "shipping diversions",
      "extended exercise zones",
      "missile launches",
      "reserve mobilisation"
    ],
    "invalidationSignals": [
      "exercise zones expire",
      "commercial traffic normalizes",
      "direct talks"
    ],
    "decisionQuestions": [
      "Are exclusion zones physically preventing commerce?",
      "Are undersea cables, ports or fabs affected?",
      "Are US/Japan forces repositioning?"
    ],
    "practicalChecks": [
      "Taiwan MND",
      "shipping notices",
      "airspace warnings",
      "major carrier behavior",
      "fab operations"
    ]
  },
  {
    "id": "taiwan-chip",
    "name": "Taiwan semiconductor disruption",
    "regions": [
      "strategic-asia",
      "north-america",
      "europe"
    ],
    "triggerConcepts": [
      "TSMC outage",
      "Hsinchu power loss",
      "earthquake fab damage",
      "water shortage"
    ],
    "priorityInstitutions": [
      "tsmc",
      "taiwan-mod",
      "taiwan-cbc"
    ],
    "strategicNodes": [
      "hsinchu",
      "kaohsiung"
    ],
    "financialExposures": [
      "semis",
      "taiwan-eq",
      "usdtwd"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "wafer output cut",
      "fab evacuation",
      "repair timeline extends",
      "supplier disruption"
    ],
    "invalidationSignals": [
      "production restored",
      "no material wafer loss"
    ],
    "decisionQuestions": [
      "Which nodes/processes are affected?",
      "Is advanced-node or packaging capacity hit?",
      "How much inventory exists downstream?"
    ],
    "practicalChecks": [
      "company statements",
      "utility reports",
      "customer/supplier disclosures"
    ]
  },
  {
    "id": "china-chip-controls",
    "name": "US/China semiconductor-control escalation",
    "regions": [
      "strategic-asia",
      "north-america",
      "europe"
    ],
    "triggerConcepts": [
      "new BIS rule",
      "entity list",
      "China retaliation",
      "equipment restriction"
    ],
    "priorityInstitutions": [
      "bis",
      "mofcom",
      "meti",
      "eu-commission"
    ],
    "strategicNodes": [
      "hsinchu",
      "shenzhen"
    ],
    "financialExposures": [
      "semis",
      "rare-earths",
      "taiwan-eq"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "licensing denial expands",
      "allied controls align",
      "China restricts materials"
    ],
    "invalidationSignals": [
      "licenses granted broadly",
      "rules delayed",
      "negotiated carve-outs"
    ],
    "decisionQuestions": [
      "Which chips/equipment/end users are covered?",
      "When do rules take effect?",
      "Which firms have substitution paths?"
    ],
    "practicalChecks": [
      "read rule text",
      "company guidance",
      "allied government actions"
    ]
  },
  {
    "id": "rare-earth-controls",
    "name": "China critical-mineral export restriction",
    "regions": [
      "strategic-asia",
      "north-america",
      "europe"
    ],
    "triggerConcepts": [
      "rare earth restriction",
      "gallium control",
      "germanium control",
      "graphite restriction"
    ],
    "priorityInstitutions": [
      "mofcom",
      "bis",
      "meti"
    ],
    "strategicNodes": [
      "shenzhen"
    ],
    "financialExposures": [
      "rare-earths",
      "semis",
      "defence-eu"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "licence approvals fall",
      "prices dislocate",
      "downstream production warnings"
    ],
    "invalidationSignals": [
      "licensing normalizes",
      "alternative supply ramps"
    ],
    "decisionQuestions": [
      "Is restriction a ban, licensing rule or end-user control?",
      "Which processing stage is concentrated in China?"
    ],
    "practicalChecks": [
      "MOFCOM text",
      "customs data",
      "producer statements"
    ]
  },
  {
    "id": "north-korea",
    "name": "North Korean strategic escalation",
    "regions": [
      "strategic-asia"
    ],
    "triggerConcepts": [
      "ICBM",
      "nuclear test",
      "artillery exchange",
      "DMZ incursion"
    ],
    "priorityInstitutions": [
      "rok-mod",
      "japan-mofa",
      "dod"
    ],
    "strategicNodes": [
      "dmz",
      "pyeongtaek",
      "busan"
    ],
    "financialExposures": [
      "kospi",
      "usdjpy",
      "gold"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "US/ROK readiness rises",
      "Japan alerts",
      "follow-on launches",
      "nuclear-site indicators"
    ],
    "invalidationSignals": [
      "hotline restored",
      "exercise pause",
      "negotiation resumed"
    ],
    "decisionQuestions": [
      "Is the test technological, coercive or preparation for conflict?",
      "Are conventional forces moving?"
    ],
    "practicalChecks": [
      "ROK/Japan official alerts",
      "US Indo-Pacific statements",
      "seismic data for nuclear test"
    ]
  },
  {
    "id": "boj-shock",
    "name": "Bank of Japan policy shock",
    "regions": [
      "strategic-asia",
      "north-america"
    ],
    "triggerConcepts": [
      "unexpected BOJ hike",
      "yield curve policy change",
      "bond purchase cut",
      "yen intervention"
    ],
    "priorityInstitutions": [
      "boj"
    ],
    "strategicNodes": [
      "ny-finance"
    ],
    "financialExposures": [
      "usdjpy",
      "nikkei",
      "treasuries"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "JPY carry unwind",
      "JGB volatility",
      "global risk deleveraging"
    ],
    "invalidationSignals": [
      "market absorbs move",
      "guidance stabilizes expectations"
    ],
    "decisionQuestions": [
      "Is the move monetary policy or FX intervention?",
      "Does global carry exposure amplify it?"
    ],
    "practicalChecks": [
      "BOJ release",
      "Japan finance ministry",
      "cross-asset volatility"
    ]
  },
  {
    "id": "south-china-sea",
    "name": "South China Sea confrontation",
    "regions": [
      "strategic-asia"
    ],
    "triggerConcepts": [
      "ship collision",
      "water cannon",
      "Second Thomas Shoal blockade",
      "coast guard confrontation"
    ],
    "priorityInstitutions": [
      "philippine-pcg",
      "china-mod",
      "dod"
    ],
    "strategicNodes": [
      "second-thomas",
      "scarborough",
      "south-china-sea"
    ],
    "financialExposures": [
      "container",
      "rare-earths"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "injuries or vessel loss",
      "treaty consultations",
      "naval assets deploy"
    ],
    "invalidationSignals": [
      "resupply succeeds",
      "incident resolves",
      "direct talks"
    ],
    "decisionQuestions": [
      "Does the incident trigger alliance obligations?",
      "Is commercial shipping affected or only state vessels?"
    ],
    "practicalChecks": [
      "coast guard releases",
      "treaty statements",
      "navigation advisories"
    ]
  },
  {
    "id": "malacca",
    "name": "Malacca/Singapore shipping disruption",
    "regions": [
      "strategic-asia"
    ],
    "triggerConcepts": [
      "Malacca closure",
      "Singapore port outage",
      "major collision",
      "shipping lane restriction"
    ],
    "priorityInstitutions": [
      "mpa-sg"
    ],
    "strategicNodes": [
      "malacca"
    ],
    "financialExposures": [
      "container",
      "tanker",
      "brent"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "traffic restrictions persist",
      "anchorage congestion grows",
      "carriers divert"
    ],
    "invalidationSignals": [
      "channel reopens",
      "backlog clears"
    ],
    "decisionQuestions": [
      "Which vessel classes are affected?",
      "Can Sunda/Lombok substitute and at what cost?"
    ],
    "practicalChecks": [
      "MPA notices",
      "carrier notices",
      "port congestion"
    ]
  },
  {
    "id": "us-tariff",
    "name": "Major US tariff shock",
    "regions": [
      "north-america",
      "strategic-asia",
      "europe"
    ],
    "triggerConcepts": [
      "new broad tariff",
      "Section 301 increase",
      "emergency tariff",
      "retaliatory tariff"
    ],
    "priorityInstitutions": [
      "white-house",
      "ustr",
      "ust",
      "mofcom",
      "eu-commission"
    ],
    "strategicNodes": [
      "washington",
      "la-longbeach"
    ],
    "financialExposures": [
      "container",
      "semis",
      "eu-autos",
      "usd-index"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "legal order published",
      "retaliation announced",
      "importers change guidance"
    ],
    "invalidationSignals": [
      "implementation delayed",
      "exemptions broaden",
      "agreement reached"
    ],
    "decisionQuestions": [
      "What products/countries and effective date?",
      "Is the measure statutory, emergency or negotiating leverage?",
      "What retaliation is credible?"
    ],
    "practicalChecks": [
      "read proclamation/rule",
      "customs guidance",
      "counterparty government response"
    ]
  },
  {
    "id": "fed-liquidity",
    "name": "US monetary/liquidity shock",
    "regions": [
      "north-america",
      "world"
    ],
    "triggerConcepts": [
      "emergency Fed move",
      "unexpected FOMC",
      "repo facility",
      "bank liquidity stress"
    ],
    "priorityInstitutions": [
      "fed",
      "ust"
    ],
    "strategicNodes": [
      "ny-finance"
    ],
    "financialExposures": [
      "treasuries",
      "usd-index",
      "bitcoin",
      "gold"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "funding spreads widen",
      "facility usage rises",
      "bank stress broadens"
    ],
    "invalidationSignals": [
      "funding normalizes",
      "facility usage falls"
    ],
    "decisionQuestions": [
      "Is the move inflation, growth or systemic-risk driven?",
      "Are dollar funding markets impaired?"
    ],
    "practicalChecks": [
      "Fed statement",
      "facility data",
      "money-market spreads"
    ]
  },
  {
    "id": "us-gulf-hurricane",
    "name": "US Gulf Coast energy/logistics shock",
    "regions": [
      "north-america"
    ],
    "triggerConcepts": [
      "major hurricane Gulf",
      "Houston channel closure",
      "refinery shutdown",
      "LNG terminal outage"
    ],
    "priorityInstitutions": [
      "doe",
      "eia"
    ],
    "strategicNodes": [
      "houston",
      "freeport-lng",
      "sabine-pass"
    ],
    "financialExposures": [
      "wti",
      "lng-eu",
      "container"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "port closure",
      "refinery run cuts",
      "LNG feedgas drops"
    ],
    "invalidationSignals": [
      "ports reopen",
      "units restart",
      "cargo schedule restored"
    ],
    "decisionQuestions": [
      "Which infrastructure is in the storm path?",
      "How much refining/LNG capacity is offline?"
    ],
    "practicalChecks": [
      "port condition notices",
      "operator statements",
      "EIA/DOE updates"
    ]
  },
  {
    "id": "port-strike-us",
    "name": "US major port labour disruption",
    "regions": [
      "north-america",
      "strategic-asia"
    ],
    "triggerConcepts": [
      "longshore strike",
      "port strike",
      "ILA strike",
      "ILWU strike"
    ],
    "priorityInstitutions": [
      "ustr"
    ],
    "strategicNodes": [
      "la-longbeach",
      "houston"
    ],
    "financialExposures": [
      "container",
      "eu-autos"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "terminal gates close",
      "vessels divert",
      "negotiations collapse"
    ],
    "invalidationSignals": [
      "tentative labour agreement",
      "terminals reopen"
    ],
    "decisionQuestions": [
      "Which coasts/ports are covered?",
      "How much inventory buffer exists?"
    ],
    "practicalChecks": [
      "union/employer statements",
      "port gate status",
      "carrier advisories"
    ]
  },
  {
    "id": "critical-cyber",
    "name": "Critical infrastructure cyberattack",
    "regions": [
      "world"
    ],
    "triggerConcepts": [
      "operational technology attack",
      "port cyberattack",
      "pipeline ransomware",
      "banking outage"
    ],
    "priorityInstitutions": [
      "cisa"
    ],
    "strategicNodes": [
      "houston",
      "rotterdam",
      "ny-finance"
    ],
    "financialExposures": [
      "container",
      "brent",
      "usd-index"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "operator confirms physical/transaction disruption",
      "multiple systems affected",
      "emergency directive"
    ],
    "invalidationSignals": [
      "systems restored",
      "incident contained",
      "no material operations impact"
    ],
    "decisionQuestions": [
      "What is confirmed operational impact?",
      "Is attribution relevant to immediate customer action?",
      "Are backups/manual procedures working?"
    ],
    "practicalChecks": [
      "operator status",
      "CISA/national CERT",
      "transaction/flow data"
    ]
  },
  {
    "id": "sovereign-stress",
    "name": "Sovereign / banking stress in priority region",
    "regions": [
      "europe",
      "middle-east",
      "strategic-asia",
      "russia-eurasia"
    ],
    "triggerConcepts": [
      "bank run",
      "capital controls",
      "sovereign default",
      "emergency liquidity"
    ],
    "priorityInstitutions": [
      "ecb",
      "boe",
      "pboc",
      "cbr"
    ],
    "strategicNodes": [
      "ny-finance"
    ],
    "financialExposures": [
      "gold",
      "usd-index",
      "eurusd"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "deposit flight",
      "withdrawal limit",
      "payment failure",
      "IMF/emergency package"
    ],
    "invalidationSignals": [
      "liquidity restored",
      "credible recapitalisation",
      "controls removed"
    ],
    "decisionQuestions": [
      "Is stress sovereign, bank-specific or currency-driven?",
      "Are cross-border payments affected?"
    ],
    "practicalChecks": [
      "central bank",
      "finance ministry",
      "bank disclosures",
      "payment status"
    ]
  },
  {
    "id": "major-earthquake-industry",
    "name": "Major earthquake affecting strategic industry",
    "regions": [
      "strategic-asia",
      "north-america",
      "middle-east",
      "europe"
    ],
    "triggerConcepts": [
      "major earthquake",
      "fab evacuation",
      "port tsunami warning",
      "refinery shutdown"
    ],
    "priorityInstitutions": [
      "usgs",
      "tsmc"
    ],
    "strategicNodes": [
      "hsinchu",
      "kaohsiung",
      "japan"
    ],
    "financialExposures": [
      "semis",
      "container",
      "brent"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "operator damage confirmed",
      "extended utility outage",
      "port closure"
    ],
    "invalidationSignals": [
      "facilities inspected and restarted",
      "utilities restored"
    ],
    "decisionQuestions": [
      "Did the event hit a strategic industrial cluster?",
      "Are transport/power/water constraints material?"
    ],
    "practicalChecks": [
      "USGS/local seismic authority",
      "operator statements",
      "utility/port notices"
    ]
  },
  {
    "id": "airspace-wave",
    "name": "Regional airspace closure cascade",
    "regions": [
      "middle-east",
      "europe",
      "strategic-asia"
    ],
    "triggerConcepts": [
      "multiple airspace closures",
      "missile warning",
      "airlines suspend routes"
    ],
    "priorityInstitutions": [
      "state",
      "fcdO",
      "japan-mofa"
    ],
    "strategicNodes": [
      "hormuz",
      "levant"
    ],
    "financialExposures": [
      "airlines",
      "brent"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "multiple FIR closures",
      "hub cancellations",
      "military warnings"
    ],
    "invalidationSignals": [
      "FIRs reopen",
      "airlines restore schedules"
    ],
    "decisionQuestions": [
      "Are closures precautionary or due active threats?",
      "Which hubs/corridors become bottlenecks?"
    ],
    "practicalChecks": [
      "NOTAMs",
      "civil aviation authorities",
      "airline operations"
    ]
  },
  {
    "id": "sanctions-bypass",
    "name": "Sanctions-evasion enforcement shock",
    "regions": [
      "russia-eurasia",
      "middle-east",
      "strategic-asia"
    ],
    "triggerConcepts": [
      "evasion network designated",
      "shadow fleet crackdown",
      "third-country bank sanctioned"
    ],
    "priorityInstitutions": [
      "ofac",
      "ust",
      "eu-council",
      "hmt"
    ],
    "strategicNodes": [
      "novorossiysk",
      "kharg"
    ],
    "financialExposures": [
      "tanker",
      "brent",
      "ruble"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "insurers/banks withdraw",
      "vessels detained",
      "secondary sanctions warning"
    ],
    "invalidationSignals": [
      "licenses/carve-outs reduce scope",
      "replacement channels emerge"
    ],
    "decisionQuestions": [
      "Which third-country intermediaries are targeted?",
      "Does enforcement constrain volume or only raise cost?"
    ],
    "practicalChecks": [
      "designation lists",
      "shipping registries",
      "bank notices"
    ]
  },
  {
    "id": "supply-chain-cable",
    "name": "Subsea cable / digital corridor disruption",
    "regions": [
      "europe",
      "strategic-asia"
    ],
    "triggerConcepts": [
      "subsea cable cut",
      "internet cable damage",
      "telecom outage"
    ],
    "priorityInstitutions": [
      "cisa",
      "nato"
    ],
    "strategicNodes": [
      "baltic",
      "luzon"
    ],
    "financialExposures": [
      "semis",
      "container"
    ],
    "phases": [
      {
        "phase": "WATCH",
        "definition": "Early indicators are present but operational consequences are not yet confirmed.",
        "requiredEvidence": [
          "one high-quality primary or independent report",
          "material trigger concept",
          "freshness within decision window"
        ]
      },
      {
        "phase": "ESCALATING",
        "definition": "Multiple indicators or an operational action materially increase probability or impact.",
        "requiredEvidence": [
          "corroboration or primary action",
          "at least one confirmation signal",
          "clear transmission path or security consequence"
        ]
      },
      {
        "phase": "ACTIVE",
        "definition": "The scenario is producing confirmed physical, legal, financial or operational effects.",
        "requiredEvidence": [
          "confirmed implementation or disruption",
          "measurable market/logistics/security impact"
        ]
      },
      {
        "phase": "NORMALISING",
        "definition": "Operational effects are reversing and confirmation signals are disappearing.",
        "requiredEvidence": [
          "credible reversal action",
          "sustained normalisation rather than rhetoric alone"
        ]
      }
    ],
    "confirmationSignals": [
      "multiple cables affected",
      "data routing degrades",
      "sabotage evidence"
    ],
    "invalidationSignals": [
      "capacity rerouted",
      "repair vessel mobilised",
      "technical fault"
    ],
    "decisionQuestions": [
      "Is there redundancy?",
      "Is financial/industrial traffic measurably impaired?"
    ],
    "practicalChecks": [
      "network operators",
      "latency/outage data",
      "government technical investigation"
    ]
  }
]);
