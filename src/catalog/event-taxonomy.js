export const EVENT_TAXONOMY = Object.freeze([
  {
    "id": "evt-001",
    "name": "Direct interstate strike",
    "category": "conflict",
    "weight": 24,
    "attentionWindowHours": 12,
    "regions": [
      "world"
    ],
    "terms": [
      "airstrike against",
      "missile strike on",
      "military strikes"
    ],
    "excludeTerms": [
      "exercise simulation"
    ],
    "whyItMatters": "Direct kinetic action between states can change escalation and market risk within minutes."
  },
  {
    "id": "evt-002",
    "name": "Ballistic missile launch",
    "category": "conflict",
    "weight": 20,
    "attentionWindowHours": 12,
    "regions": [
      "middle-east",
      "strategic-asia",
      "russia-eurasia"
    ],
    "terms": [
      "ballistic missile launched",
      "missile launch detected",
      "ICBM launched"
    ],
    "excludeTerms": [
      "space launch vehicle"
    ],
    "whyItMatters": "Launches affect regional readiness, airspace and sanctions expectations."
  },
  {
    "id": "evt-003",
    "name": "Large drone attack",
    "category": "conflict",
    "weight": 17,
    "attentionWindowHours": 12,
    "regions": [
      "middle-east",
      "europe",
      "russia-eurasia"
    ],
    "terms": [
      "drone attack",
      "UAV attack",
      "one-way attack drone"
    ],
    "excludeTerms": [
      "drone show"
    ],
    "whyItMatters": "Drone attacks can disrupt energy, port and military infrastructure at low warning."
  },
  {
    "id": "evt-004",
    "name": "Military mobilisation",
    "category": "conflict",
    "weight": 21,
    "attentionWindowHours": 24,
    "regions": [
      "world"
    ],
    "terms": [
      "mobilisation announced",
      "mobilization announced",
      "reserve call-up",
      "conscription expansion"
    ],
    "excludeTerms": [
      "routine annual call-up"
    ],
    "whyItMatters": "Mobilisation is a costly signal of sustained military intent or manpower stress."
  },
  {
    "id": "evt-005",
    "name": "Strategic exercise",
    "category": "conflict",
    "weight": 13,
    "attentionWindowHours": 24,
    "regions": [
      "strategic-asia",
      "europe",
      "russia-eurasia",
      "middle-east"
    ],
    "terms": [
      "large-scale military exercise",
      "joint exercise",
      "live-fire drill"
    ],
    "excludeTerms": [
      "scheduled small exercise"
    ],
    "whyItMatters": "Exercises matter when scale, geography or scenario changes operational risk."
  },
  {
    "id": "evt-006",
    "name": "Naval blockade/quarantine",
    "category": "conflict",
    "weight": 25,
    "attentionWindowHours": 12,
    "regions": [
      "strategic-asia",
      "middle-east"
    ],
    "terms": [
      "naval blockade",
      "maritime quarantine",
      "blockade exercise"
    ],
    "excludeTerms": [],
    "whyItMatters": "Blockade language or implementation directly threatens trade flows and escalation."
  },
  {
    "id": "evt-007",
    "name": "Base attack",
    "category": "conflict",
    "weight": 20,
    "attentionWindowHours": 12,
    "regions": [
      "middle-east",
      "europe",
      "strategic-asia"
    ],
    "terms": [
      "military base attacked",
      "base came under attack",
      "rockets hit base"
    ],
    "excludeTerms": [
      "training accident"
    ],
    "whyItMatters": "Attacks on foreign bases can force retaliation and force-protection changes."
  },
  {
    "id": "evt-008",
    "name": "Cross-border artillery exchange",
    "category": "conflict",
    "weight": 18,
    "attentionWindowHours": 12,
    "regions": [
      "strategic-asia",
      "middle-east",
      "europe"
    ],
    "terms": [
      "artillery exchange",
      "cross-border shelling",
      "artillery fire across border"
    ],
    "excludeTerms": [],
    "whyItMatters": "Sustained cross-border fire can escalate rapidly even without strategic strikes."
  },
  {
    "id": "evt-009",
    "name": "Ceasefire breach",
    "category": "conflict",
    "weight": 15,
    "attentionWindowHours": 12,
    "regions": [
      "world"
    ],
    "terms": [
      "ceasefire violated",
      "ceasefire breach",
      "truce violation"
    ],
    "excludeTerms": [
      "alleged without evidence"
    ],
    "whyItMatters": "Repeated breaches undermine de-escalation and can restart wider operations."
  },
  {
    "id": "evt-010",
    "name": "Verified ceasefire implementation",
    "category": "diplomacy",
    "weight": -15,
    "attentionWindowHours": 24,
    "regions": [
      "world"
    ],
    "terms": [
      "ceasefire took effect",
      "cessation implemented",
      "forces began withdrawing"
    ],
    "excludeTerms": [],
    "whyItMatters": "Implemented operational de-escalation is more valuable than negotiation headlines."
  },
  {
    "id": "evt-011",
    "name": "Nuclear enrichment increase",
    "category": "nuclear",
    "weight": 24,
    "attentionWindowHours": 24,
    "regions": [
      "middle-east"
    ],
    "terms": [
      "enrichment increased",
      "60 percent enriched",
      "highly enriched uranium"
    ],
    "excludeTerms": [],
    "whyItMatters": "Changes in enrichment level or stockpile can alter breakout assessments and coercive pressure."
  },
  {
    "id": "evt-012",
    "name": "IAEA access restriction",
    "category": "nuclear",
    "weight": 21,
    "attentionWindowHours": 24,
    "regions": [
      "middle-east"
    ],
    "terms": [
      "IAEA access denied",
      "inspectors barred",
      "monitoring cameras removed"
    ],
    "excludeTerms": [],
    "whyItMatters": "Verification loss raises uncertainty and encourages worst-case planning."
  },
  {
    "id": "evt-013",
    "name": "Nuclear facility attack threat",
    "category": "nuclear",
    "weight": 22,
    "attentionWindowHours": 12,
    "regions": [
      "middle-east"
    ],
    "terms": [
      "strike nuclear facilities",
      "attack nuclear sites",
      "military option nuclear"
    ],
    "excludeTerms": [
      "historical discussion"
    ],
    "whyItMatters": "Threats become material when paired with force posture or evacuation indicators."
  },
  {
    "id": "evt-014",
    "name": "Nuclear doctrine change",
    "category": "nuclear",
    "weight": 22,
    "attentionWindowHours": 24,
    "regions": [
      "russia-eurasia",
      "europe",
      "strategic-asia"
    ],
    "terms": [
      "nuclear doctrine changed",
      "lowered nuclear threshold",
      "nuclear use doctrine"
    ],
    "excludeTerms": [],
    "whyItMatters": "Formal doctrine changes affect strategic deterrence assumptions."
  },
  {
    "id": "evt-015",
    "name": "Nuclear test preparation",
    "category": "nuclear",
    "weight": 24,
    "attentionWindowHours": 24,
    "regions": [
      "strategic-asia"
    ],
    "terms": [
      "nuclear test preparation",
      "test site activity",
      "nuclear test imminent"
    ],
    "excludeTerms": [
      "past satellite archive"
    ],
    "whyItMatters": "Credible test preparation can trigger alliance readiness and sanctions responses."
  },
  {
    "id": "evt-016",
    "name": "Major sanctions designation",
    "category": "sanctions",
    "weight": 17,
    "attentionWindowHours": 24,
    "regions": [
      "world"
    ],
    "terms": [
      "sanctions designated",
      "added to sanctions list",
      "asset freeze imposed"
    ],
    "excludeTerms": [
      "opinion column"
    ],
    "whyItMatters": "New legal restrictions can immediately alter counterparty and payment risk."
  },
  {
    "id": "evt-017",
    "name": "Secondary sanctions warning",
    "category": "sanctions",
    "weight": 19,
    "attentionWindowHours": 24,
    "regions": [
      "middle-east",
      "russia-eurasia",
      "strategic-asia"
    ],
    "terms": [
      "secondary sanctions",
      "foreign financial institutions risk sanctions"
    ],
    "excludeTerms": [],
    "whyItMatters": "Third-country exposure can make enforcement effects much broader than bilateral sanctions."
  },
  {
    "id": "evt-018",
    "name": "Sanctions general licence",
    "category": "sanctions",
    "weight": -7,
    "attentionWindowHours": 48,
    "regions": [
      "world"
    ],
    "terms": [
      "general license issued",
      "sanctions waiver granted",
      "authorized transactions"
    ],
    "excludeTerms": [],
    "whyItMatters": "Licensing can reopen specific legal transaction channels; scope and duration matter."
  },
  {
    "id": "evt-019",
    "name": "Shadow fleet enforcement",
    "category": "sanctions",
    "weight": 16,
    "attentionWindowHours": 48,
    "regions": [
      "russia-eurasia",
      "middle-east",
      "europe"
    ],
    "terms": [
      "shadow fleet sanctions",
      "tanker designated",
      "vessel sanctioned"
    ],
    "excludeTerms": [],
    "whyItMatters": "Vessel sanctions can reduce effective fleet availability and raise freight/compliance costs."
  },
  {
    "id": "evt-020",
    "name": "Export-control expansion",
    "category": "policy",
    "weight": 17,
    "attentionWindowHours": 48,
    "regions": [
      "north-america",
      "strategic-asia",
      "europe"
    ],
    "terms": [
      "export controls expanded",
      "new license requirement",
      "entity list additions"
    ],
    "excludeTerms": [],
    "whyItMatters": "Technology controls can change strategic supply chains and company revenue access."
  },
  {
    "id": "evt-021",
    "name": "Commercial ship attacked",
    "category": "shipping",
    "weight": 23,
    "attentionWindowHours": 12,
    "regions": [
      "middle-east",
      "strategic-asia",
      "europe",
      "russia-eurasia"
    ],
    "terms": [
      "merchant ship attacked",
      "tanker attacked",
      "container ship hit"
    ],
    "excludeTerms": [
      "historical anniversary"
    ],
    "whyItMatters": "Physical attacks change route economics and insurance immediately."
  },
  {
    "id": "evt-022",
    "name": "Commercial ship seized",
    "category": "shipping",
    "weight": 21,
    "attentionWindowHours": 12,
    "regions": [
      "middle-east",
      "strategic-asia"
    ],
    "terms": [
      "vessel seized",
      "tanker seized",
      "merchant ship boarded"
    ],
    "excludeTerms": [],
    "whyItMatters": "Seizure risk is a direct route and counterparty-security signal."
  },
  {
    "id": "evt-023",
    "name": "Major carrier rerouting",
    "category": "shipping",
    "weight": 18,
    "attentionWindowHours": 24,
    "regions": [
      "middle-east",
      "europe",
      "strategic-asia"
    ],
    "terms": [
      "reroute around Cape",
      "suspend Red Sea transit",
      "avoid Suez"
    ],
    "excludeTerms": [],
    "whyItMatters": "Carrier routing is revealed preference and often more useful than rhetoric."
  },
  {
    "id": "evt-024",
    "name": "Canal closure",
    "category": "shipping",
    "weight": 25,
    "attentionWindowHours": 6,
    "regions": [
      "middle-east",
      "strategic-asia"
    ],
    "terms": [
      "Suez Canal closed",
      "canal traffic suspended",
      "Panama Canal closed"
    ],
    "excludeTerms": [
      "partial maintenance window"
    ],
    "whyItMatters": "Canal closures can immediately alter ton-mile demand and delivery times."
  },
  {
    "id": "evt-025",
    "name": "Port closure",
    "category": "shipping",
    "weight": 20,
    "attentionWindowHours": 12,
    "regions": [
      "world"
    ],
    "terms": [
      "port closed",
      "terminal operations suspended",
      "harbour closed"
    ],
    "excludeTerms": [
      "small recreational port"
    ],
    "whyItMatters": "Major port closures create measurable cargo backlogs and route substitution."
  },
  {
    "id": "evt-026",
    "name": "Port strike",
    "category": "shipping",
    "weight": 16,
    "attentionWindowHours": 48,
    "regions": [
      "europe",
      "north-america",
      "strategic-asia"
    ],
    "terms": [
      "port strike",
      "dockworkers strike",
      "longshore workers strike"
    ],
    "excludeTerms": [],
    "whyItMatters": "Labour stoppages at major ports can disrupt inventories and freight rates."
  },
  {
    "id": "evt-027",
    "name": "Major port cyberattack",
    "category": "cyber",
    "weight": 20,
    "attentionWindowHours": 12,
    "regions": [
      "world"
    ],
    "terms": [
      "port cyberattack",
      "terminal systems cyber",
      "port ransomware"
    ],
    "excludeTerms": [],
    "whyItMatters": "Digital port outages can halt cargo operations without physical damage."
  },
  {
    "id": "evt-028",
    "name": "Undersea cable damage",
    "category": "infrastructure",
    "weight": 17,
    "attentionWindowHours": 24,
    "regions": [
      "europe",
      "strategic-asia"
    ],
    "terms": [
      "subsea cable damaged",
      "undersea cable cut",
      "telecom cable severed"
    ],
    "excludeTerms": [],
    "whyItMatters": "Cable damage can affect connectivity and become a hybrid-security signal if incidents cluster."
  },
  {
    "id": "evt-029",
    "name": "Pipeline outage",
    "category": "energy",
    "weight": 19,
    "attentionWindowHours": 12,
    "regions": [
      "europe",
      "russia-eurasia",
      "north-america",
      "middle-east"
    ],
    "terms": [
      "pipeline shut down",
      "pipeline outage",
      "flows suspended"
    ],
    "excludeTerms": [
      "scheduled maintenance"
    ],
    "whyItMatters": "Physical flow loss can reprice regional energy before broader macro data reacts."
  },
  {
    "id": "evt-030",
    "name": "Oil terminal outage",
    "category": "energy",
    "weight": 21,
    "attentionWindowHours": 12,
    "regions": [
      "middle-east",
      "russia-eurasia",
      "north-america"
    ],
    "terms": [
      "oil terminal closed",
      "loading suspended",
      "export terminal outage"
    ],
    "excludeTerms": [
      "brief weather delay"
    ],
    "whyItMatters": "Export-terminal disruptions translate directly into cargo scheduling and prompt supply."
  },
  {
    "id": "evt-031",
    "name": "Refinery outage",
    "category": "energy",
    "weight": 16,
    "attentionWindowHours": 24,
    "regions": [
      "world"
    ],
    "terms": [
      "refinery outage",
      "refinery shut down",
      "refining units offline"
    ],
    "excludeTerms": [
      "planned turnaround"
    ],
    "whyItMatters": "Large unplanned refinery outages can move product cracks even if crude supply is unchanged."
  },
  {
    "id": "evt-032",
    "name": "LNG terminal outage",
    "category": "energy",
    "weight": 21,
    "attentionWindowHours": 12,
    "regions": [
      "middle-east",
      "north-america",
      "europe",
      "strategic-asia"
    ],
    "terms": [
      "LNG terminal outage",
      "liquefaction suspended",
      "LNG force majeure"
    ],
    "excludeTerms": [
      "planned maintenance"
    ],
    "whyItMatters": "LNG outages can transmit across regions through spot cargo competition."
  },
  {
    "id": "evt-033",
    "name": "OPEC production change",
    "category": "energy",
    "weight": 17,
    "attentionWindowHours": 24,
    "regions": [
      "middle-east"
    ],
    "terms": [
      "OPEC+ production cut",
      "OPEC+ production increase",
      "voluntary oil cut"
    ],
    "excludeTerms": [
      "unchanged quota"
    ],
    "whyItMatters": "Unexpected supply policy can move crude and inflation expectations."
  },
  {
    "id": "evt-034",
    "name": "Strategic reserve release",
    "category": "energy",
    "weight": -6,
    "attentionWindowHours": 24,
    "regions": [
      "north-america",
      "europe",
      "strategic-asia"
    ],
    "terms": [
      "strategic reserve release",
      "SPR release announced",
      "emergency oil stocks released"
    ],
    "excludeTerms": [],
    "whyItMatters": "Reserve use can buffer a physical shortage and reveal official concern."
  },
  {
    "id": "evt-035",
    "name": "Power grid emergency",
    "category": "infrastructure",
    "weight": 19,
    "attentionWindowHours": 12,
    "regions": [
      "world"
    ],
    "terms": [
      "grid emergency",
      "rolling blackout",
      "power system emergency",
      "electricity rationing"
    ],
    "excludeTerms": [
      "local brief outage"
    ],
    "whyItMatters": "Grid stress can halt industry, communications and transport."
  },
  {
    "id": "evt-036",
    "name": "Industrial gas curtailment",
    "category": "energy",
    "weight": 18,
    "attentionWindowHours": 24,
    "regions": [
      "europe",
      "strategic-asia"
    ],
    "terms": [
      "industrial gas curtailment",
      "gas rationing industry",
      "mandatory demand reduction"
    ],
    "excludeTerms": [],
    "whyItMatters": "Forced industrial curtailment is evidence that an energy shock has reached the real economy."
  },
  {
    "id": "evt-037",
    "name": "Central bank surprise hike",
    "category": "macro",
    "weight": 17,
    "attentionWindowHours": 12,
    "regions": [
      "world"
    ],
    "terms": [
      "unexpected rate hike",
      "surprise rate hike",
      "emergency rate hike"
    ],
    "excludeTerms": [],
    "whyItMatters": "Surprise tightening can reprice FX, rates and risk assets rapidly."
  },
  {
    "id": "evt-038",
    "name": "Central bank surprise cut",
    "category": "macro",
    "weight": 15,
    "attentionWindowHours": 12,
    "regions": [
      "world"
    ],
    "terms": [
      "unexpected rate cut",
      "emergency rate cut",
      "surprise rate cut"
    ],
    "excludeTerms": [],
    "whyItMatters": "Unscheduled or unexpected easing can signal growth or financial stress."
  },
  {
    "id": "evt-039",
    "name": "FX intervention",
    "category": "macro",
    "weight": 13,
    "attentionWindowHours": 12,
    "regions": [
      "strategic-asia",
      "russia-eurasia"
    ],
    "terms": [
      "foreign exchange intervention",
      "yen intervention",
      "currency intervention"
    ],
    "excludeTerms": [],
    "whyItMatters": "Intervention can cause abrupt FX moves and reveal policy tolerance thresholds."
  },
  {
    "id": "evt-040",
    "name": "Capital controls",
    "category": "financial-stability",
    "weight": 24,
    "attentionWindowHours": 12,
    "regions": [
      "russia-eurasia",
      "middle-east",
      "strategic-asia"
    ],
    "terms": [
      "capital controls imposed",
      "withdrawal limits",
      "mandatory currency conversion"
    ],
    "excludeTerms": [],
    "whyItMatters": "Controls directly affect convertibility, settlement and ability to exit positions."
  },
  {
    "id": "evt-041",
    "name": "Bank run/liquidity emergency",
    "category": "financial-stability",
    "weight": 24,
    "attentionWindowHours": 12,
    "regions": [
      "world"
    ],
    "terms": [
      "bank run",
      "emergency liquidity",
      "deposit flight",
      "withdrawal restrictions"
    ],
    "excludeTerms": [],
    "whyItMatters": "Funding stress can spread quickly through confidence and payment channels."
  },
  {
    "id": "evt-042",
    "name": "Sovereign default/restructuring",
    "category": "financial-stability",
    "weight": 25,
    "attentionWindowHours": 24,
    "regions": [
      "world"
    ],
    "terms": [
      "sovereign default",
      "debt restructuring",
      "missed bond payment"
    ],
    "excludeTerms": [
      "technical delay resolved"
    ],
    "whyItMatters": "Default changes credit, currency and domestic banking risk."
  },
  {
    "id": "evt-043",
    "name": "Broad tariff announcement",
    "category": "trade",
    "weight": 17,
    "attentionWindowHours": 48,
    "regions": [
      "north-america",
      "strategic-asia",
      "europe"
    ],
    "terms": [
      "blanket tariff",
      "broad tariffs",
      "additional tariff on imports"
    ],
    "excludeTerms": [
      "minor product tariff"
    ],
    "whyItMatters": "Broad tariffs can change inflation, sourcing and retaliation expectations."
  },
  {
    "id": "evt-044",
    "name": "Retaliatory tariff",
    "category": "trade",
    "weight": 15,
    "attentionWindowHours": 48,
    "regions": [
      "north-america",
      "strategic-asia",
      "europe"
    ],
    "terms": [
      "retaliatory tariff",
      "counter-tariffs",
      "tariff retaliation"
    ],
    "excludeTerms": [],
    "whyItMatters": "Retaliation raises probability of a persistent trade cycle rather than one-sided bargaining."
  },
  {
    "id": "evt-045",
    "name": "Critical mineral restriction",
    "category": "trade",
    "weight": 20,
    "attentionWindowHours": 48,
    "regions": [
      "strategic-asia"
    ],
    "terms": [
      "gallium export restriction",
      "germanium export restriction",
      "rare earth export restriction",
      "graphite export restriction"
    ],
    "excludeTerms": [],
    "whyItMatters": "Processing concentration can produce outsized industrial effects from licensing changes."
  },
  {
    "id": "evt-046",
    "name": "Semiconductor fab outage",
    "category": "semiconductors",
    "weight": 22,
    "attentionWindowHours": 12,
    "regions": [
      "strategic-asia",
      "north-america",
      "europe"
    ],
    "terms": [
      "semiconductor fab outage",
      "fab evacuated",
      "wafer production halted"
    ],
    "excludeTerms": [
      "small legacy-node fab"
    ],
    "whyItMatters": "Advanced-node outages can propagate to AI, electronics and autos depending on inventory."
  },
  {
    "id": "evt-047",
    "name": "Advanced chip restriction",
    "category": "semiconductors",
    "weight": 20,
    "attentionWindowHours": 48,
    "regions": [
      "north-america",
      "strategic-asia",
      "europe"
    ],
    "terms": [
      "advanced AI chip restriction",
      "advanced computing rule",
      "semiconductor equipment restriction"
    ],
    "excludeTerms": [],
    "whyItMatters": "Controls can affect both near-term revenue and long-term technology capability."
  },
  {
    "id": "evt-048",
    "name": "Major earthquake in industrial cluster",
    "category": "natural-hazard",
    "weight": 18,
    "attentionWindowHours": 12,
    "regions": [
      "strategic-asia",
      "north-america",
      "middle-east",
      "europe"
    ],
    "terms": [
      "major earthquake",
      "strong earthquake"
    ],
    "excludeTerms": [
      "remote area no damage"
    ],
    "whyItMatters": "Only industrial/logistics impact matters; magnitude alone should not dominate the feed."
  },
  {
    "id": "evt-049",
    "name": "Tsunami warning at major port",
    "category": "natural-hazard",
    "weight": 20,
    "attentionWindowHours": 6,
    "regions": [
      "strategic-asia",
      "north-america"
    ],
    "terms": [
      "tsunami warning",
      "major tsunami warning"
    ],
    "excludeTerms": [
      "advisory cancelled immediately"
    ],
    "whyItMatters": "Port/fab exposure makes some tsunami warnings financially material before damage is known."
  },
  {
    "id": "evt-050",
    "name": "Typhoon/hurricane port shutdown",
    "category": "natural-hazard",
    "weight": 16,
    "attentionWindowHours": 24,
    "regions": [
      "strategic-asia",
      "north-america"
    ],
    "terms": [
      "port closed due typhoon",
      "port closed due hurricane",
      "hurricane port condition zulu"
    ],
    "excludeTerms": [],
    "whyItMatters": "Weather becomes relevant when strategic ports, refineries or fabs stop operating."
  },
  {
    "id": "evt-051",
    "name": "Embassy ordered departure",
    "category": "security",
    "weight": 19,
    "attentionWindowHours": 12,
    "regions": [
      "world"
    ],
    "terms": [
      "ordered departure embassy",
      "non-emergency personnel departure",
      "embassy evacuation"
    ],
    "excludeTerms": [],
    "whyItMatters": "Evacuation decisions are costly official signals and often precede wider public warnings."
  },
  {
    "id": "evt-052",
    "name": "Travel warning escalation",
    "category": "security",
    "weight": 10,
    "attentionWindowHours": 24,
    "regions": [
      "world"
    ],
    "terms": [
      "travel advisory raised",
      "do not travel warning",
      "leave immediately advisory"
    ],
    "excludeTerms": [],
    "whyItMatters": "Official warning changes can reveal deterioration but need operational corroboration for market impact."
  },
  {
    "id": "evt-053",
    "name": "Border closure",
    "category": "security",
    "weight": 16,
    "attentionWindowHours": 12,
    "regions": [
      "europe",
      "middle-east",
      "strategic-asia"
    ],
    "terms": [
      "border closed",
      "land crossing closed",
      "frontier sealed"
    ],
    "excludeTerms": [
      "brief local crossing maintenance"
    ],
    "whyItMatters": "Border closure can disrupt trade, labour and evacuation routes."
  },
  {
    "id": "evt-054",
    "name": "Mass evacuation order",
    "category": "security",
    "weight": 18,
    "attentionWindowHours": 12,
    "regions": [
      "middle-east",
      "europe",
      "strategic-asia"
    ],
    "terms": [
      "mass evacuation order",
      "residents ordered to evacuate",
      "evacuation zone expanded"
    ],
    "excludeTerms": [],
    "whyItMatters": "Large evacuations indicate expected kinetic or natural-hazard risk."
  },
  {
    "id": "evt-055",
    "name": "Government collapse",
    "category": "politics",
    "weight": 13,
    "attentionWindowHours": 48,
    "regions": [
      "europe",
      "middle-east",
      "strategic-asia"
    ],
    "terms": [
      "government collapsed",
      "coalition collapsed",
      "prime minister resigned after government fell"
    ],
    "excludeTerms": [
      "routine cabinet reshuffle"
    ],
    "whyItMatters": "Political instability matters when it changes fiscal, sanctions, defence or trade policy."
  },
  {
    "id": "evt-056",
    "name": "State of emergency",
    "category": "politics",
    "weight": 18,
    "attentionWindowHours": 24,
    "regions": [
      "world"
    ],
    "terms": [
      "state of emergency declared",
      "martial law declared",
      "emergency powers invoked"
    ],
    "excludeTerms": [],
    "whyItMatters": "Emergency powers can alter mobility, finance and security conditions quickly."
  },
  {
    "id": "evt-057",
    "name": "Mass strategic-industry strike",
    "category": "infrastructure",
    "weight": 15,
    "attentionWindowHours": 48,
    "regions": [
      "europe",
      "north-america",
      "strategic-asia"
    ],
    "terms": [
      "nationwide rail strike",
      "energy workers strike",
      "dockworker strike"
    ],
    "excludeTerms": [
      "small local walkout"
    ],
    "whyItMatters": "Labour action matters when it blocks a strategic network rather than generating political spectacle."
  },
  {
    "id": "evt-058",
    "name": "Confirmed critical cyber outage",
    "category": "cyber",
    "weight": 22,
    "attentionWindowHours": 12,
    "regions": [
      "world"
    ],
    "terms": [
      "cyberattack caused outage",
      "ransomware halted operations",
      "cyber incident disrupted operations"
    ],
    "excludeTerms": [
      "unconfirmed attribution only"
    ],
    "whyItMatters": "Operational effect is the key filter; attribution can wait."
  },
  {
    "id": "evt-059",
    "name": "Payment system outage",
    "category": "cyber",
    "weight": 20,
    "attentionWindowHours": 6,
    "regions": [
      "world"
    ],
    "terms": [
      "payment system outage",
      "bank transfer outage",
      "card network outage"
    ],
    "excludeTerms": [
      "single bank app bug"
    ],
    "whyItMatters": "Broad payment disruption can affect commerce and confidence immediately."
  },
  {
    "id": "evt-060",
    "name": "Satellite/GPS disruption",
    "category": "infrastructure",
    "weight": 15,
    "attentionWindowHours": 24,
    "regions": [
      "europe",
      "strategic-asia",
      "middle-east"
    ],
    "terms": [
      "GPS jamming",
      "GNSS interference",
      "satellite navigation disruption"
    ],
    "excludeTerms": [
      "isolated handset issue"
    ],
    "whyItMatters": "Persistent navigation interference can affect aviation, shipping and military risk."
  },
  {
    "id": "evt-061",
    "name": "Major weapons procurement",
    "category": "policy",
    "weight": 9,
    "attentionWindowHours": 168,
    "regions": [
      "europe",
      "strategic-asia",
      "middle-east"
    ],
    "terms": [
      "major defence contract",
      "missile procurement",
      "air defence purchase"
    ],
    "excludeTerms": [
      "minor maintenance contract"
    ],
    "whyItMatters": "Large procurement signals persistent policy and industrial demand rather than immediate crisis."
  },
  {
    "id": "evt-062",
    "name": "Defence spending structural increase",
    "category": "policy",
    "weight": 10,
    "attentionWindowHours": 720,
    "regions": [
      "europe",
      "strategic-asia"
    ],
    "terms": [
      "defence spending target increased",
      "rearmament plan",
      "multi-year defence package"
    ],
    "excludeTerms": [],
    "whyItMatters": "Multi-year spending commitments matter for industrial exposure more than daily rhetoric."
  },
  {
    "id": "evt-063",
    "name": "Peace framework signed",
    "category": "diplomacy",
    "weight": -12,
    "attentionWindowHours": 72,
    "regions": [
      "world"
    ],
    "terms": [
      "peace framework signed",
      "peace agreement signed",
      "normalization agreement"
    ],
    "excludeTerms": [],
    "whyItMatters": "Signed frameworks can reduce risk if implementation mechanisms exist."
  },
  {
    "id": "evt-064",
    "name": "Negotiation breakdown",
    "category": "diplomacy",
    "weight": 12,
    "attentionWindowHours": 24,
    "regions": [
      "world"
    ],
    "terms": [
      "talks collapsed",
      "negotiations broke down",
      "walked out of talks"
    ],
    "excludeTerms": [],
    "whyItMatters": "Breakdown removes a de-escalation path, especially when force posture is already elevated."
  },
  {
    "id": "evt-065",
    "name": "Prisoner/hostage exchange",
    "category": "diplomacy",
    "weight": -5,
    "attentionWindowHours": 48,
    "regions": [
      "middle-east",
      "europe"
    ],
    "terms": [
      "prisoner exchange",
      "hostage release agreement"
    ],
    "excludeTerms": [],
    "whyItMatters": "Humanitarian deals can be an early but weak indicator of functioning negotiation channels."
  },
  {
    "id": "evt-066",
    "name": "Alliance treaty consultation",
    "category": "security",
    "weight": 15,
    "attentionWindowHours": 24,
    "regions": [
      "europe",
      "strategic-asia"
    ],
    "terms": [
      "Article 4 consultations",
      "mutual defense treaty consultation",
      "alliance consultations"
    ],
    "excludeTerms": [],
    "whyItMatters": "Formal alliance consultation can precede reinforcement or collective action."
  },
  {
    "id": "evt-067",
    "name": "Major reserve deployment",
    "category": "security",
    "weight": 17,
    "attentionWindowHours": 12,
    "regions": [
      "middle-east",
      "europe",
      "strategic-asia"
    ],
    "terms": [
      "air defence deployed",
      "additional interceptors deployed",
      "reserve forces deployed"
    ],
    "excludeTerms": [
      "routine rotation"
    ],
    "whyItMatters": "Costly defensive deployments can reveal threat assessment even without public detail."
  },
  {
    "id": "evt-068",
    "name": "Insurance withdrawal",
    "category": "shipping",
    "weight": 17,
    "attentionWindowHours": 24,
    "regions": [
      "middle-east",
      "europe",
      "strategic-asia"
    ],
    "terms": [
      "war risk cover withdrawn",
      "insurers stop covering",
      "insurance exclusion zone"
    ],
    "excludeTerms": [],
    "whyItMatters": "Insurance withdrawal can halt commerce before governments formally close a route."
  },
  {
    "id": "evt-069",
    "name": "Commodity export ban",
    "category": "trade",
    "weight": 18,
    "attentionWindowHours": 48,
    "regions": [
      "russia-eurasia",
      "strategic-asia",
      "middle-east"
    ],
    "terms": [
      "export ban announced",
      "commodity exports banned",
      "exports suspended"
    ],
    "excludeTerms": [
      "temporary paperwork issue"
    ],
    "whyItMatters": "Export bans can create immediate physical scarcity where supply is concentrated."
  },
  {
    "id": "evt-070",
    "name": "Strategic stockpiling",
    "category": "trade",
    "weight": 10,
    "attentionWindowHours": 168,
    "regions": [
      "strategic-asia",
      "north-america",
      "europe"
    ],
    "terms": [
      "strategic stockpile increased",
      "emergency stockpiling",
      "state reserves buying"
    ],
    "excludeTerms": [],
    "whyItMatters": "Stockpiling can signal official concern and itself tighten spot availability."
  }
]);
