export const SCENARIOS = Object.freeze([
  {
    "id": "us-iran-escalation",
    "name": "US\u2013Iran escalation",
    "regionId": "middle-east",
    "triggerTerms": [
      "iran",
      "united states",
      "us military",
      "strike",
      "retaliation",
      "hormuz"
    ],
    "confirmationSignals": [
      "US/DoD force posture change",
      "Iranian official threat to shipping",
      "verified attack on US or allied forces",
      "airspace or maritime restriction"
    ],
    "invalidationSignals": [
      "verified ceasefire mechanism",
      "force drawdown",
      "sustained diplomatic agreement"
    ],
    "decisionQuestions": [
      "Does this threaten Hormuz or Gulf energy exports?",
      "Are US assets or bases changing posture?",
      "Are tanker rates, oil and gold confirming the signal?",
      "Are airlines or embassies changing operations?"
    ],
    "riskActions": [
      "Review Gulf-linked suppliers and routes",
      "Check energy and freight exposure",
      "Verify official travel/airspace notices",
      "Require corroboration before acting on battlefield claims"
    ]
  },
  {
    "id": "iran-nuclear-breakout",
    "name": "Iran nuclear escalation",
    "regionId": "middle-east",
    "triggerTerms": [
      "iran",
      "iaea",
      "uranium",
      "enrichment",
      "centrifuge"
    ],
    "confirmationSignals": [
      "IAEA technical finding",
      "formal sanctions response",
      "evacuation or force-protection changes"
    ],
    "invalidationSignals": [
      "restored inspections",
      "verified enrichment rollback",
      "formal agreement"
    ],
    "decisionQuestions": [
      "Is the change technical and verified or rhetorical?",
      "Does it change sanctions or strike probability?",
      "Are prediction markets and energy markets repricing?"
    ],
    "riskActions": [
      "Prioritize IAEA and official documents",
      "Track sanctions effective dates",
      "Map regional airspace and energy exposure"
    ]
  },
  {
    "id": "taiwan-blockade-risk",
    "name": "Taiwan blockade / quarantine risk",
    "regionId": "strategic-asia",
    "triggerTerms": [
      "taiwan",
      "blockade",
      "quarantine",
      "pla",
      "exercise",
      "strait"
    ],
    "confirmationSignals": [
      "sustained exclusion zones",
      "merchant shipping diversion",
      "mobilised Chinese maritime/air assets",
      "Taiwan or allied readiness changes"
    ],
    "invalidationSignals": [
      "exercise ends on schedule",
      "shipping normalizes",
      "formal de-escalation"
    ],
    "decisionQuestions": [
      "Are exercises different in duration, geography or force mix?",
      "Are commercial carriers diverting?",
      "Is semiconductor logistics being disrupted?"
    ],
    "riskActions": [
      "Map semiconductor dependencies",
      "Check freight and insurance changes",
      "Track Taiwan/Japan/US official notices"
    ]
  },
  {
    "id": "ukraine-black-sea",
    "name": "Black Sea escalation",
    "regionId": "europe",
    "triggerTerms": [
      "ukraine",
      "black sea",
      "odesa",
      "novorossiysk",
      "grain"
    ],
    "confirmationSignals": [
      "port closure",
      "verified infrastructure strike",
      "shipping warning",
      "insurance repricing"
    ],
    "invalidationSignals": [
      "ports reopen",
      "shipping normalizes",
      "ceasefire enforcement"
    ],
    "decisionQuestions": [
      "Is export capacity materially reduced?",
      "Are grain/oil flows affected?",
      "Is NATO/Russian posture changing?"
    ],
    "riskActions": [
      "Review Black Sea shipping exposure",
      "Track grain and energy benchmarks",
      "Corroborate military claims"
    ]
  },
  {
    "id": "korean-escalation",
    "name": "Korean Peninsula escalation",
    "regionId": "strategic-asia",
    "triggerTerms": [
      "north korea",
      "missile",
      "nuclear",
      "dmz"
    ],
    "confirmationSignals": [
      "multiple launches",
      "nuclear test indicators",
      "South Korean/US readiness change",
      "evacuation guidance"
    ],
    "invalidationSignals": [
      "sustained dialogue",
      "exercise cancellation",
      "verified stand-down"
    ],
    "decisionQuestions": [
      "Is this routine signalling or a material posture change?",
      "Are Japan/Korea defence measures changing?"
    ],
    "riskActions": [
      "Track official military statements",
      "Check KRW and regional market response",
      "Avoid over-weighting KCNA claims"
    ]
  },
  {
    "id": "europe-energy-shock",
    "name": "European energy shock",
    "regionId": "europe",
    "triggerTerms": [
      "gas",
      "pipeline",
      "lng",
      "power",
      "blackout",
      "europe"
    ],
    "confirmationSignals": [
      "physical flow reduction",
      "major terminal/pipeline outage",
      "power emergency declaration"
    ],
    "invalidationSignals": [
      "flow restoration",
      "inventory relief",
      "mild-demand offset"
    ],
    "decisionQuestions": [
      "How much physical supply is lost?",
      "Which industrial sectors are exposed?",
      "Is the shock regional or Europe-wide?"
    ],
    "riskActions": [
      "Track gas/power benchmarks",
      "Map industrial exposure",
      "Check government emergency measures"
    ]
  },
  {
    "id": "us-tariff-shock",
    "name": "US tariff / trade shock",
    "regionId": "north-america",
    "triggerTerms": [
      "tariff",
      "import duty",
      "export control",
      "trade war"
    ],
    "confirmationSignals": [
      "signed order or published rule",
      "named tariff schedule",
      "retaliatory measure"
    ],
    "invalidationSignals": [
      "policy delay",
      "exemption",
      "court suspension"
    ],
    "decisionQuestions": [
      "What is the effective date?",
      "Which HS codes/sectors are affected?",
      "Which substitute suppliers benefit?"
    ],
    "riskActions": [
      "Use official text over headlines",
      "Map affected supply chains",
      "Track retaliatory measures"
    ]
  },
  {
    "id": "global-cyber-port",
    "name": "Port or logistics cyberattack",
    "regionId": "world",
    "triggerTerms": [
      "cyber",
      "port",
      "terminal",
      "shipping",
      "ransomware"
    ],
    "confirmationSignals": [
      "operator outage notice",
      "vessel queue growth",
      "customs or terminal suspension"
    ],
    "invalidationSignals": [
      "systems restored",
      "backlog clears"
    ],
    "decisionQuestions": [
      "Is physical throughput affected?",
      "Which alternative ports have capacity?"
    ],
    "riskActions": [
      "Check operator notices",
      "Map alternative ports",
      "Separate IT outage from physical damage"
    ]
  }
]);
