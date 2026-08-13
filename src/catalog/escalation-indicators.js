export const ESCALATION_INDICATORS = Object.freeze([
  {
    "id": "mil-01",
    "label": "Strategic force deployment",
    "direction": "escalate",
    "weight": 18,
    "categories": [
      "conflict",
      "military"
    ],
    "regions": [
      "world"
    ],
    "terms": [
      "carrier strike group",
      "bomber deployment",
      "additional forces",
      "forward deployment"
    ],
    "whyItMatters": "Forward movement of high-end forces increases capacity and can indicate preparation or coercive signalling.",
    "confirmationTerms": []
  },
  {
    "id": "mil-02",
    "label": "Reserve mobilisation",
    "direction": "escalate",
    "weight": 20,
    "categories": [
      "conflict",
      "military"
    ],
    "regions": [
      "world"
    ],
    "terms": [
      "reserve mobilisation",
      "reserve mobilization",
      "call-up orders",
      "mobilisation decree"
    ],
    "whyItMatters": "Large personnel call-ups are costly signals that can precede wider operations.",
    "confirmationTerms": []
  },
  {
    "id": "mil-03",
    "label": "Airspace closure",
    "direction": "escalate",
    "weight": 17,
    "categories": [
      "aviation",
      "conflict"
    ],
    "regions": [
      "world"
    ],
    "terms": [
      "airspace closed",
      "airspace closure",
      "notam closure",
      "flight information region closed"
    ],
    "whyItMatters": "Broad airspace restrictions often accompany imminent military risk or severe security deterioration.",
    "confirmationTerms": []
  },
  {
    "id": "mil-04",
    "label": "Embassy evacuation",
    "direction": "escalate",
    "weight": 18,
    "categories": [
      "security",
      "diplomacy"
    ],
    "regions": [
      "world"
    ],
    "terms": [
      "evacuate embassy",
      "ordered departure",
      "non-essential staff leave",
      "embassy evacuation"
    ],
    "whyItMatters": "Government evacuation actions can be stronger signals than public rhetoric because they incur operational cost.",
    "confirmationTerms": []
  },
  {
    "id": "mil-05",
    "label": "Force protection increase",
    "direction": "escalate",
    "weight": 13,
    "categories": [
      "conflict",
      "security"
    ],
    "regions": [
      "world"
    ],
    "terms": [
      "force protection level",
      "heightened force protection",
      "bases on alert"
    ],
    "whyItMatters": "Raised force protection indicates official assessment of increased threat.",
    "confirmationTerms": []
  },
  {
    "id": "mil-06",
    "label": "Missile launch preparation",
    "direction": "escalate",
    "weight": 19,
    "categories": [
      "conflict",
      "military"
    ],
    "regions": [
      "middle-east",
      "strategic-asia",
      "russia-eurasia"
    ],
    "terms": [
      "missile units dispersed",
      "launch preparation",
      "missile launchers deployed",
      "ballistic missile alert"
    ],
    "whyItMatters": "Launch preparation indicators materially raise short-horizon strike risk.",
    "confirmationTerms": []
  },
  {
    "id": "mil-07",
    "label": "Naval exclusion warning",
    "direction": "escalate",
    "weight": 16,
    "categories": [
      "shipping",
      "conflict"
    ],
    "regions": [
      "middle-east",
      "strategic-asia",
      "russia-eurasia"
    ],
    "terms": [
      "navigation warning",
      "naval exclusion zone",
      "live fire zone",
      "shipping exclusion"
    ],
    "whyItMatters": "Exclusion notices can interrupt commerce and precede exercises or operations.",
    "confirmationTerms": []
  },
  {
    "id": "mil-08",
    "label": "Military hotline activated",
    "direction": "deescalate",
    "weight": -7,
    "categories": [
      "diplomacy",
      "conflict"
    ],
    "regions": [
      "world"
    ],
    "terms": [
      "military hotline",
      "deconfliction channel",
      "direct military talks"
    ],
    "whyItMatters": "Active deconfliction mechanisms reduce accidental escalation risk when credible.",
    "confirmationTerms": []
  },
  {
    "id": "dip-01",
    "label": "Formal ceasefire agreement",
    "direction": "deescalate",
    "weight": -20,
    "categories": [
      "diplomacy",
      "conflict"
    ],
    "regions": [
      "world"
    ],
    "terms": [
      "ceasefire agreement",
      "cessation of hostilities",
      "truce takes effect"
    ],
    "whyItMatters": "A signed and implemented ceasefire can sharply reduce immediate kinetic risk, though compliance must be monitored.",
    "confirmationTerms": []
  },
  {
    "id": "dip-02",
    "label": "Direct high-level talks",
    "direction": "deescalate",
    "weight": -9,
    "categories": [
      "diplomacy"
    ],
    "regions": [
      "world"
    ],
    "terms": [
      "direct talks",
      "face-to-face talks",
      "negotiations resumed",
      "high-level dialogue"
    ],
    "whyItMatters": "Direct talks create an off-ramp but do not by themselves remove operational risk.",
    "confirmationTerms": []
  },
  {
    "id": "dip-03",
    "label": "Mediator shuttle diplomacy",
    "direction": "deescalate",
    "weight": -6,
    "categories": [
      "diplomacy"
    ],
    "regions": [
      "middle-east",
      "europe"
    ],
    "terms": [
      "mediator",
      "mediation effort",
      "Oman mediation",
      "Qatar mediation"
    ],
    "whyItMatters": "Credible mediation can reduce near-term escalation probability when parties engage.",
    "confirmationTerms": []
  },
  {
    "id": "dip-04",
    "label": "Diplomatic rupture",
    "direction": "escalate",
    "weight": 11,
    "categories": [
      "diplomacy",
      "conflict"
    ],
    "regions": [
      "world"
    ],
    "terms": [
      "expelled ambassador",
      "sever diplomatic relations",
      "closed embassy",
      "recalled ambassador"
    ],
    "whyItMatters": "Breaking diplomatic channels reduces communication and often accompanies broader confrontation.",
    "confirmationTerms": []
  },
  {
    "id": "nuc-01",
    "label": "High enrichment threshold",
    "direction": "escalate",
    "weight": 22,
    "categories": [
      "nuclear"
    ],
    "regions": [
      "middle-east"
    ],
    "terms": [
      "60% enriched",
      "near weapons grade",
      "highly enriched uranium",
      "enrichment to 60"
    ],
    "whyItMatters": "Higher enrichment materially shortens theoretical breakout timelines and raises diplomatic/military pressure.",
    "confirmationTerms": []
  },
  {
    "id": "nuc-02",
    "label": "Inspector access reduced",
    "direction": "escalate",
    "weight": 17,
    "categories": [
      "nuclear"
    ],
    "regions": [
      "middle-east"
    ],
    "terms": [
      "inspectors barred",
      "monitoring equipment removed",
      "safeguards access restricted",
      "IAEA access denied"
    ],
    "whyItMatters": "Reduced verification raises uncertainty and can worsen worst-case assumptions.",
    "confirmationTerms": []
  },
  {
    "id": "nuc-03",
    "label": "IAEA censure or referral",
    "direction": "escalate",
    "weight": 12,
    "categories": [
      "nuclear",
      "diplomacy"
    ],
    "regions": [
      "middle-east"
    ],
    "terms": [
      "IAEA resolution",
      "Board of Governors censure",
      "non-compliance resolution"
    ],
    "whyItMatters": "Formal censure can trigger sanctions pressure and escalation in negotiations.",
    "confirmationTerms": []
  },
  {
    "id": "nuc-04",
    "label": "Verified dilution or rollback",
    "direction": "deescalate",
    "weight": -16,
    "categories": [
      "nuclear"
    ],
    "regions": [
      "middle-east"
    ],
    "terms": [
      "diluted enriched uranium",
      "reduced stockpile",
      "centrifuges disconnected",
      "IAEA verified rollback"
    ],
    "whyItMatters": "Verified technical rollback is materially stronger than rhetorical de-escalation.",
    "confirmationTerms": []
  },
  {
    "id": "san-01",
    "label": "Secondary sanctions announced",
    "direction": "escalate",
    "weight": 16,
    "categories": [
      "sanctions",
      "finance"
    ],
    "regions": [
      "middle-east",
      "russia-eurasia",
      "strategic-asia"
    ],
    "terms": [
      "secondary sanctions",
      "foreign financial institutions sanctions",
      "sanctions evasion network"
    ],
    "whyItMatters": "Secondary sanctions can force third-country firms and banks to change behaviour quickly.",
    "confirmationTerms": []
  },
  {
    "id": "san-02",
    "label": "Major general licence issued",
    "direction": "deescalate",
    "weight": -8,
    "categories": [
      "sanctions",
      "finance"
    ],
    "regions": [
      "world"
    ],
    "terms": [
      "general license authorizes",
      "sanctions waiver",
      "temporary authorization"
    ],
    "whyItMatters": "Licensing relief can reopen specific transactions but scope must be read precisely.",
    "confirmationTerms": []
  },
  {
    "id": "san-03",
    "label": "Energy export sanctions tightened",
    "direction": "escalate",
    "weight": 15,
    "categories": [
      "sanctions",
      "energy"
    ],
    "regions": [
      "middle-east",
      "russia-eurasia"
    ],
    "terms": [
      "oil export sanctions",
      "price cap enforcement",
      "tanker sanctions",
      "petroleum sanctions"
    ],
    "whyItMatters": "Energy sanctions alter effective supply, freight and payment risk.",
    "confirmationTerms": []
  },
  {
    "id": "ship-01",
    "label": "Commercial vessel attacked",
    "direction": "escalate",
    "weight": 20,
    "categories": [
      "shipping",
      "conflict"
    ],
    "regions": [
      "middle-east",
      "strategic-asia",
      "russia-eurasia"
    ],
    "terms": [
      "merchant vessel attacked",
      "tanker attacked",
      "container ship struck",
      "vessel hit by missile"
    ],
    "whyItMatters": "Physical attacks on commercial shipping can immediately reprice freight and war-risk insurance.",
    "confirmationTerms": []
  },
  {
    "id": "ship-02",
    "label": "Vessel seizure",
    "direction": "escalate",
    "weight": 18,
    "categories": [
      "shipping",
      "conflict"
    ],
    "regions": [
      "middle-east",
      "strategic-asia"
    ],
    "terms": [
      "tanker seized",
      "ship seized",
      "vessel detained",
      "boarded merchant vessel"
    ],
    "whyItMatters": "State or proxy seizure increases route and counterparty risk.",
    "confirmationTerms": []
  },
  {
    "id": "ship-03",
    "label": "Major carrier route suspension",
    "direction": "escalate",
    "weight": 15,
    "categories": [
      "shipping"
    ],
    "regions": [
      "middle-east",
      "strategic-asia",
      "europe"
    ],
    "terms": [
      "suspend red sea transit",
      "reroute around cape",
      "suspend port calls",
      "halted sailings"
    ],
    "whyItMatters": "Carrier behaviour provides a market-relevant revealed-preference signal about route risk.",
    "confirmationTerms": []
  },
  {
    "id": "ship-04",
    "label": "Carrier routes restored",
    "direction": "deescalate",
    "weight": -10,
    "categories": [
      "shipping"
    ],
    "regions": [
      "middle-east",
      "strategic-asia",
      "europe"
    ],
    "terms": [
      "resume red sea transit",
      "restore port calls",
      "return to suez"
    ],
    "whyItMatters": "Sustained restoration by major carriers suggests risk economics are improving.",
    "confirmationTerms": []
  },
  {
    "id": "energy-01",
    "label": "Major oil facility outage",
    "direction": "escalate",
    "weight": 19,
    "categories": [
      "energy",
      "infrastructure"
    ],
    "regions": [
      "middle-east",
      "russia-eurasia",
      "north-america"
    ],
    "terms": [
      "refinery outage",
      "oil terminal outage",
      "production halted",
      "processing plant offline"
    ],
    "whyItMatters": "Large physical outages can tighten prompt supply independent of rhetoric.",
    "confirmationTerms": []
  },
  {
    "id": "energy-02",
    "label": "Strategic reserve release",
    "direction": "deescalate",
    "weight": -7,
    "categories": [
      "energy",
      "policy"
    ],
    "regions": [
      "north-america",
      "europe",
      "strategic-asia"
    ],
    "terms": [
      "strategic petroleum reserve release",
      "SPR release",
      "emergency oil stocks"
    ],
    "whyItMatters": "Reserve releases can buffer physical shortages and dampen price spikes.",
    "confirmationTerms": []
  },
  {
    "id": "energy-03",
    "label": "OPEC surprise cut",
    "direction": "escalate",
    "weight": 14,
    "categories": [
      "energy"
    ],
    "regions": [
      "middle-east"
    ],
    "terms": [
      "surprise production cut",
      "additional voluntary cuts",
      "OPEC+ cut"
    ],
    "whyItMatters": "Unexpected supply restraint can reprice crude and inflation expectations.",
    "confirmationTerms": []
  },
  {
    "id": "energy-04",
    "label": "LNG force majeure",
    "direction": "escalate",
    "weight": 18,
    "categories": [
      "energy",
      "shipping"
    ],
    "regions": [
      "middle-east",
      "russia-eurasia",
      "north-america"
    ],
    "terms": [
      "LNG force majeure",
      "cargoes suspended",
      "liquefaction outage"
    ],
    "whyItMatters": "LNG outages can rapidly affect regional gas spreads and tanker demand.",
    "confirmationTerms": []
  },
  {
    "id": "trade-01",
    "label": "Advanced semiconductor controls",
    "direction": "escalate",
    "weight": 15,
    "categories": [
      "policy",
      "semiconductors",
      "trade"
    ],
    "regions": [
      "north-america",
      "strategic-asia",
      "europe"
    ],
    "terms": [
      "advanced computing export controls",
      "semiconductor equipment restrictions",
      "AI chip export ban"
    ],
    "whyItMatters": "Controls can alter chip revenue, equipment demand and strategic supply chains.",
    "confirmationTerms": []
  },
  {
    "id": "trade-02",
    "label": "Rare-earth export restriction",
    "direction": "escalate",
    "weight": 17,
    "categories": [
      "trade",
      "commodities"
    ],
    "regions": [
      "strategic-asia"
    ],
    "terms": [
      "rare earth export restrictions",
      "gallium export controls",
      "germanium export controls",
      "graphite export controls"
    ],
    "whyItMatters": "Critical-mineral restrictions can create industrial bottlenecks beyond the directly targeted market.",
    "confirmationTerms": []
  },
  {
    "id": "trade-03",
    "label": "Large tariff increase",
    "direction": "escalate",
    "weight": 14,
    "categories": [
      "trade",
      "policy"
    ],
    "regions": [
      "north-america",
      "strategic-asia",
      "europe"
    ],
    "terms": [
      "tariff increased",
      "additional tariff",
      "Section 301 tariff",
      "retaliatory tariff"
    ],
    "whyItMatters": "Large tariffs change landed costs and can provoke retaliation or sourcing shifts.",
    "confirmationTerms": []
  },
  {
    "id": "macro-01",
    "label": "Emergency rate move",
    "direction": "escalate",
    "weight": 13,
    "categories": [
      "macro",
      "financial-stability"
    ],
    "regions": [
      "world"
    ],
    "terms": [
      "emergency rate hike",
      "emergency rate cut",
      "unscheduled rate decision"
    ],
    "whyItMatters": "Unscheduled monetary action is often evidence of acute inflation, currency or financial stress.",
    "confirmationTerms": []
  },
  {
    "id": "macro-02",
    "label": "Capital controls imposed",
    "direction": "escalate",
    "weight": 20,
    "categories": [
      "macro",
      "financial-stability"
    ],
    "regions": [
      "russia-eurasia",
      "middle-east",
      "strategic-asia"
    ],
    "terms": [
      "capital controls imposed",
      "foreign exchange restrictions",
      "withdrawal limits",
      "mandatory FX sales"
    ],
    "whyItMatters": "Capital controls directly affect convertibility, settlement and investor access.",
    "confirmationTerms": []
  },
  {
    "id": "macro-03",
    "label": "Bank emergency liquidity",
    "direction": "escalate",
    "weight": 18,
    "categories": [
      "financial-stability"
    ],
    "regions": [
      "world"
    ],
    "terms": [
      "emergency liquidity assistance",
      "bank run",
      "liquidity facility activated",
      "deposit flight"
    ],
    "whyItMatters": "Emergency liquidity signals potential systemic stress even when authorities reassure markets.",
    "confirmationTerms": []
  },
  {
    "id": "cyber-01",
    "label": "Critical infrastructure cyber outage",
    "direction": "escalate",
    "weight": 18,
    "categories": [
      "cyber",
      "infrastructure"
    ],
    "regions": [
      "world"
    ],
    "terms": [
      "cyberattack disrupted",
      "ransomware shut down",
      "operational technology attack",
      "critical infrastructure outage"
    ],
    "whyItMatters": "Confirmed operational impact matters more than attribution claims and can affect logistics, energy or finance.",
    "confirmationTerms": []
  },
  {
    "id": "cyber-02",
    "label": "Payment network disruption",
    "direction": "escalate",
    "weight": 17,
    "categories": [
      "cyber",
      "finance"
    ],
    "regions": [
      "world"
    ],
    "terms": [
      "payment network outage",
      "banking system cyberattack",
      "SWIFT disruption",
      "card network outage"
    ],
    "whyItMatters": "Payment outages can disrupt settlement and commerce even without physical damage.",
    "confirmationTerms": []
  },
  {
    "id": "dom-01",
    "label": "State of emergency declared",
    "direction": "escalate",
    "weight": 16,
    "categories": [
      "politics",
      "security"
    ],
    "regions": [
      "world"
    ],
    "terms": [
      "state of emergency declared",
      "martial law",
      "emergency powers invoked"
    ],
    "whyItMatters": "Emergency powers often accompany severe domestic or external security deterioration.",
    "confirmationTerms": []
  },
  {
    "id": "dom-02",
    "label": "Mass port or rail strike",
    "direction": "escalate",
    "weight": 14,
    "categories": [
      "shipping",
      "infrastructure"
    ],
    "regions": [
      "europe",
      "north-america",
      "strategic-asia"
    ],
    "terms": [
      "port strike",
      "dockworker strike",
      "rail strike",
      "longshore strike"
    ],
    "whyItMatters": "Labour action at major logistics nodes can create measurable supply-chain disruption.",
    "confirmationTerms": []
  },
  {
    "id": "asia-01",
    "label": "Taiwan blockade language",
    "direction": "escalate",
    "weight": 22,
    "categories": [
      "conflict",
      "shipping"
    ],
    "regions": [
      "strategic-asia"
    ],
    "terms": [
      "blockade Taiwan",
      "quarantine Taiwan",
      "encirclement drill",
      "joint blockade"
    ],
    "whyItMatters": "Blockade or quarantine concepts threaten one of the world’s most important semiconductor and shipping hubs.",
    "confirmationTerms": []
  },
  {
    "id": "asia-02",
    "label": "PLA median-line surge",
    "direction": "escalate",
    "weight": 14,
    "categories": [
      "conflict",
      "military"
    ],
    "regions": [
      "strategic-asia"
    ],
    "terms": [
      "crossed the median line",
      "record PLA aircraft",
      "large-scale joint exercise"
    ],
    "whyItMatters": "Unusually large PLA activity around Taiwan raises operational and miscalculation risk.",
    "confirmationTerms": []
  },
  {
    "id": "asia-03",
    "label": "North Korea ICBM or nuclear test",
    "direction": "escalate",
    "weight": 21,
    "categories": [
      "conflict",
      "nuclear"
    ],
    "regions": [
      "strategic-asia"
    ],
    "terms": [
      "ICBM launch",
      "nuclear test",
      "intercontinental ballistic missile"
    ],
    "whyItMatters": "Strategic weapons tests can rapidly raise regional military readiness and sanctions pressure.",
    "confirmationTerms": []
  },
  {
    "id": "asia-04",
    "label": "Korean hotline restoration",
    "direction": "deescalate",
    "weight": -8,
    "categories": [
      "diplomacy",
      "conflict"
    ],
    "regions": [
      "strategic-asia"
    ],
    "terms": [
      "inter-Korean hotline restored",
      "military hotline restored"
    ],
    "whyItMatters": "Restored communication reduces accidental escalation risk but does not remove weapons capability.",
    "confirmationTerms": []
  },
  {
    "id": "rus-01",
    "label": "Russian nuclear signalling",
    "direction": "escalate",
    "weight": 21,
    "categories": [
      "conflict",
      "nuclear"
    ],
    "regions": [
      "russia-eurasia",
      "europe"
    ],
    "terms": [
      "nuclear forces exercise",
      "nuclear doctrine changed",
      "tactical nuclear weapons",
      "strategic deterrence forces"
    ],
    "whyItMatters": "Changes in nuclear posture deserve high priority even when used as coercive signalling.",
    "confirmationTerms": []
  },
  {
    "id": "rus-02",
    "label": "Black Sea port closure",
    "direction": "escalate",
    "weight": 17,
    "categories": [
      "shipping",
      "conflict"
    ],
    "regions": [
      "russia-eurasia",
      "europe"
    ],
    "terms": [
      "Black Sea port closed",
      "Novorossiysk suspended",
      "Odesa port closed",
      "grain corridor suspended"
    ],
    "whyItMatters": "Black Sea access affects energy, grain and regional logistics.",
    "confirmationTerms": []
  },
  {
    "id": "eu-01",
    "label": "NATO Article 4 consultations",
    "direction": "escalate",
    "weight": 14,
    "categories": [
      "conflict",
      "security"
    ],
    "regions": [
      "europe"
    ],
    "terms": [
      "Article 4 consultations",
      "NATO Article 4"
    ],
    "whyItMatters": "Article 4 consultation indicates an ally considers territorial integrity or security threatened.",
    "confirmationTerms": []
  },
  {
    "id": "eu-02",
    "label": "NATO reinforcement",
    "direction": "escalate",
    "weight": 17,
    "categories": [
      "conflict",
      "military"
    ],
    "regions": [
      "europe"
    ],
    "terms": [
      "NATO reinforcement",
      "additional battlegroup",
      "eastern flank reinforcement"
    ],
    "whyItMatters": "Material reinforcement changes regional force posture and escalation expectations.",
    "confirmationTerms": []
  },
  {
    "id": "us-01",
    "label": "US national emergency trade powers",
    "direction": "escalate",
    "weight": 14,
    "categories": [
      "trade",
      "policy"
    ],
    "regions": [
      "north-america"
    ],
    "terms": [
      "IEEPA tariffs",
      "national emergency tariffs",
      "emergency economic powers"
    ],
    "whyItMatters": "Emergency trade authorities can produce faster and broader policy shifts than normal trade processes.",
    "confirmationTerms": []
  }
]);
